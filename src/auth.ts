import type { Account, Profile, TokenSet } from '@auth/core/types';
import { Pool } from '@neondatabase/serverless';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import Discord, { type DiscordProfile } from 'next-auth/providers/discord';
import GitHub, { type GitHubProfile } from 'next-auth/providers/github';
import type { NextRequest } from 'next/server';

import PostgresAdapter from '@/db/adapter-pg';
import { sendAuditLog } from '@/utils/audit-log';
import { isJoinedGuild, sendDirectMessage } from '@/utils/discord';
import { isJoinedOrganization } from '@/utils/github';

const undefinedPromise = Promise.resolve(undefined);

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
}: {
  adapterUser: AdapterUser | undefined;
  account: Account | null;
  profile: Profile | undefined;
  adapter: Adapter;
}) => {
  if (adapterUser && adapter.updateUser) {
    if (account?.provider === 'discord') {
      const { name, email, image, isJoinedGuild } =
        (await getDiscordProfile(undefinedPromise)(
          profile as DiscordProfile,
          account,
        )) ?? {};

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
    }
  }
};

const getDiscordProfile =
  (adapterUserPromise: Promise<AdapterUser | undefined>) =>
  async (profile: DiscordProfile, token: TokenSet) => {
    const user = {
      ...(await Discord({}).profile?.(profile, token)),
      discordUserID: profile.id,
    };
    if (token?.access_token && !(await adapterUserPromise)) {
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

export const config = (request: NextRequest | undefined) => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
  const adapter = PostgresAdapter(pool);
  const adapterUserPromise = getUser({ request, adapter });

  return {
    adapter: adapter,
    callbacks: {
      async signIn({ user, account, profile }) {
        const adapterUser = await adapterUserPromise;
        const discordUserID = user.discordUserID ?? adapterUser?.discordUserID;

        if (!discordUserID) {
          return false;
        }

        await Promise.all([
          sendDirectMessage({
            userID: discordUserID,
            message: `[NID.kt](https://discord.gg/nid-kt) の Web サイトへようこそ！✨🙌🏻\n\`${account?.provider}\` でログインしました ✅`,
          }),
          updateAdapterUser({ adapterUser, account, profile, adapter }),
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
        profile: getDiscordProfile(adapterUserPromise),
      }),
      GitHub,
    ],
    theme: { logo: '/icon.png' },
  } satisfies NextAuthConfig;
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
