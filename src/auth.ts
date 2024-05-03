import PostgresAdapter from '@auth/pg-adapter';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true,
});

export const config: NextAuthConfig = {
  adapter: PostgresAdapter(pool),
  providers: [
    Discord({
      authorization:
        'https://discord.com/oauth2/authorize?scope=identify+guilds',
    }),
    GitHub,
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
