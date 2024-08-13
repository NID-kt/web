import Google from '@auth/core/providers/google';
import type { Account, Profile, TokenSet } from '@auth/core/types';
import { Pool } from '@neondatabase/serverless';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type {
  Adapter,
  AdapterAccountType,
  AdapterUser,
} from 'next-auth/adapters';
import Discord, { type DiscordProfile } from 'next-auth/providers/discord';
import GitHub, { type GitHubProfile } from 'next-auth/providers/github';
import type { NextRequest } from 'next/server';

import PostgresAdapter, { updateAccount } from '@/db/adapter-pg';
import { sendAuditLog } from '@/utils/audit-log';
import { isJoinedGuild, sendDirectMessage } from '@/utils/discord';
import { isJoinedOrganization } from '@/utils/github';

const getUser = async ({
  request,
  adapter,
}: { request: NextRequest | undefined; adapter: Adapter }) => {
  if (!request) {
    return undefined;
  }

  const useSecureCookies = request.url.startsWith('https://');
  const cookiePrefix = useSecureCookies ? '__Secure-' : '';
  const sessiontoken = request.cookies.get(
    `${cookiePrefix}authjs.session-token`,
  )?.value;

  if (!sessiontoken) {
    return undefined;
  }

  const { user } = (await adapter.getSessionAndUser?.(sessiontoken)) ?? {};
  return user;
};

const updateAdapterUser = async ({
  adapterUser,
  account,
  profile,
  adapter,
  pool,
}: {
  adapterUser: AdapterUser | undefined;
  account: Account | null;
  profile: Profile | undefined;
  adapter: Adapter;
  pool: Pool;
}) => {
  if (adapterUser && adapter.updateUser) {
    if (account?.provider === 'discord') {
      const { name, email, image, isJoinedGuild } =
        (await getDiscordProfile()(profile as DiscordProfile, account)) ?? {};

      await adapter.updateUser({
        ...adapterUser,
        name: name,
        email: email ?? undefined,
        image: image,
        isJoinedGuild: isJoinedGuild,
      });
    } else if (account?.provider === 'github') {
      const { githubUserID, githubUserName, isJoinedOrganization } =
        (await getGitHubProfile?.(
          profile as unknown as GitHubProfile,
          account,
        )) ?? {};

      await adapter.updateUser({
        ...adapterUser,
        githubUserID: githubUserID,
        githubUserName: githubUserName,
        isJoinedOrganization: isJoinedOrganization,
      });
    } else if (account?.provider === 'google') {
      updateAccount(pool, account);

      await adapter.updateUser({
        ...adapterUser,
        googleUserID: account.providerAccountId,
      });
    }
  }
};

const getDiscordProfile =
  (adapterUser?: AdapterUser) =>
  async (profile: DiscordProfile, token: TokenSet) => {
    const user = {
      ...(await Discord({}).profile?.(profile, token)),
      discordUserID: profile.id,
    };
    if (token?.access_token && !adapterUser) {
      user.isJoinedGuild = await isJoinedGuild(token.access_token);
    }
    return user;
  };

const getGitHubProfile = async (profile: GitHubProfile, token: TokenSet) => {
  const user = {
    ...(await GitHub({}).profile?.(profile, token)),
    githubUserID: profile.id,
    githubUserName: profile.login,
  };
  if (user.githubUserName) {
    user.isJoinedOrganization = await isJoinedOrganization(user.githubUserName);
  }
  return user;
};

export const config = async (request: NextRequest | undefined) => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
  const adapter = PostgresAdapter(pool);
  const adapterUser = await getUser({ request, adapter });

  return {
    adapter: adapter,
    callbacks: {
      async signIn({ user, account, profile }) {
        const discordUserID = user.discordUserID ?? adapterUser?.discordUserID;

        if (!discordUserID) {
          return false;
        }

        await Promise.all([
          sendDirectMessage({
            userID: discordUserID,
            message: `[NID.kt](https://discord.gg/nid-kt) の Web サイトへようこそ！✨🙌🏻\n\`${account?.provider}\` でログインしました ✅`,
          }),
          updateAdapterUser({ adapterUser, account, profile, adapter, pool }),
        ]);

        return true;
      },
    },
    events: {
      signIn: async (params) => {
        // biome-ignore lint:noNonNullAssertion - To avoid sending sensitive data
        params.account = undefined!;
        await sendAuditLog('signIn', params, params.user);
      },
      createUser: async (params) => {
        await sendAuditLog('createUser', params, params.user);
      },
      updateUser: async (params) => {
        await sendAuditLog('updateUser', params, params.user);
      },
      linkAccount: async (params) => {
        const user = params.user;
        // biome-ignore lint:noNonNullAssertion - To avoid sending sensitive data
        params.account = undefined!;
        await sendAuditLog('linkAccount', params, user);
      },
    },
    providers: [
      Discord<DiscordProfile>({
        authorization:
          'https://discord.com/oauth2/authorize?scope=identify+guilds',
        profile: getDiscordProfile(adapterUser),
      }),
      GitHub,
      Google({
        authorization: {
          params: {
            // https://github.com/nextauthjs/next-auth/blob/748c9ecb8ce10bef2b628520451f676db0499f9d/docs/pages/guides/configuring-oauth-providers.mdx
            scope: 'openid https://www.googleapis.com/auth/calendar',
            // https://authjs.dev/getting-started/providers/google
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ],
    theme: { logo: '/icon.png' },
  } satisfies NextAuthConfig;
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
