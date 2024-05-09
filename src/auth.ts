import NextAuth from 'next-auth';
import type { NextAuthConfig, User } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import { Pool } from 'pg';

import PostgresAdapter from '@/db/adapter-pg';
import { isJoinedGuild } from '@/utils/discord';
import { isJoinedOrganization } from '@/utils/github';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true,
});

const codeBlock = '```';

const sendAuditLog = (method: string, message: object, user: User) => {
  const formData = new FormData();

  const content = JSON.stringify({ method: method, ...user }, null, 2);
  const payload = JSON.stringify({
    content: `${codeBlock}json\n${content}\n${codeBlock}`,
    username: user.name,
    avatar_url: user.image,
    flags: 4096,
  });
  formData.append('payload_json', payload);

  const messageBlob = new Blob(
    [JSON.stringify({ method: method, ...message }, null, 2)],
    { type: 'application/json' },
  );
  formData.append('file[0]', messageBlob, 'message.json');

  // biome-ignore lint:noNonNullAssertion - We know this is defined
  return fetch(process.env.AUDIT_LOG_WEBHOOK!, {
    method: 'POST',
    body: formData,
  });
};

const adapter = PostgresAdapter(pool);

export const config: NextAuthConfig = {
  adapter: adapter,
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
      if ('emailVerified' in user && adapter.updateUser) {
        const {
          isJoinedGuild,
          isJoinedOrganization,
          githubUserID,
          githubUserName,
        } = params.profile;

        await adapter.updateUser({
          ...user,
          isJoinedGuild: user.isJoinedGuild ?? isJoinedGuild,
          isJoinedOrganization:
            user.isJoinedOrganization ?? isJoinedOrganization,
          githubUserID: user.githubUserID ?? githubUserID,
          githubUserName: user.githubUserName ?? githubUserName,
        });
      }
      // biome-ignore lint:noNonNullAssertion - To avoid sending sensitive data
      params.account = undefined!;
      await sendAuditLog('linkAccount', params, user);
    },
  },
  providers: [
    Discord({
      authorization:
        'https://discord.com/oauth2/authorize?scope=identify+guilds',
      profile: async (profile, token) => {
        const user = {
          ...(await Discord({}).profile?.(profile, token)),
          discordUserID: profile.id,
        };
        if (token?.access_token) {
          user.isJoinedGuild = await isJoinedGuild(token.access_token);
        }
        return user;
      },
    }),
    GitHub({
      profile: async (profile, token) => {
        const user = {
          ...(await GitHub({}).profile?.(profile, token)),
          githubUserID: profile.id,
          githubUserName: profile.login,
        };
        if (user.githubUserName) {
          user.isJoinedOrganization = await isJoinedOrganization(
            // biome-ignore lint:noNonNullAssertion - We know this is defined
            process.env.GITHUB_ACCESS_TOKEN!,
            user.githubUserName,
          );
        }
        return user;
      },
    }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
