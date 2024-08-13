import { auth } from '@/auth';
import { REST } from '@discordjs/rest';
import { sql } from '@vercel/postgres';
import { type APIGuildScheduledEvent, Routes } from 'discord-api-types/v10';
import { redirect } from 'next/navigation';
import { createCalEvent, removeCalEvent } from './calendarService';
import { transformAPIGuildScheduledEventToScheduledEvent } from './mapping';

async function updateUserToken(user: {
  id: string;
  access_token: string;
  expires_at: number;
}) {
  await sql`
    UPDATE accounts SET 
      access_token = ${user.access_token},
      expires_at = ${user.expires_at}
    WHERE "userId" = ${user.id} AND provider = 'google';
  `;
}

async function retrieveUserToken(id: string): Promise<{
  id: string;
  refresh_token: string;
  access_token: string;
  expires_at: number;
} | null> {
  const result = await sql<{
    id: string;
    refresh_token: string;
    access_token: string;
    expires_at: number;
  }>`
    SELECT users.id, accounts.refresh_token, accounts.access_token, accounts.expires_at FROM users
    JOIN accounts ON accounts."userId" = users.id
    WHERE users.id = ${id} AND accounts.provider = 'google';
  `;
  const userToken = result.rows[0];
  if (!userToken) {
    return null;
  }
  if (userToken.expires_at < Math.floor(Date.now() / 1000) + 60) {
    const json = await refreshAccessToken(userToken.refresh_token);
    if (!json) {
      // リフレッシュトークンが無効な場合、削除とgoogleUserIdのnull設定
      await sql`
        DELETE FROM accounts WHERE "userId" = ${id} AND provider = 'google';
      `;
      await sql`
        UPDATE users SET "googleUserId" = NULL WHERE id = ${id};
      `;

      return null;
    }

    userToken.access_token = json.access_token;
    userToken.expires_at = json.expires_at;
    await updateUserToken(userToken);
  }

  return userToken;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? '',
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (
    res.status !== 200 ||
    typeof json.access_token !== 'string' ||
    typeof json.expires_in !== 'number'
  ) {
    return null;
  }

  return {
    access_token: json.access_token,
    expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
  };
}

async function updateIsLinkedToCalendar(id: string, value: boolean) {
  await sql`
    UPDATE users SET
      "isLinkedToCalendar" = ${value}
    WHERE
      id = ${id};
  `;
}

export async function linkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id || user.isLinkedToCalendar) {
    return;
  }
  const userAndToken = await retrieveUserToken(user.id);
  if (!userAndToken) {
    return;
  }

  await updateIsLinkedToCalendar(user.id, true);

  const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_BOT_TOKEN as string,
  );
  const events = (await rest.get(
    Routes.guildScheduledEvents(process.env.DISCORD_GUILD_ID as string),
  )) as APIGuildScheduledEvent[];
  for (const event of events) {
    createCalEvent(
      userAndToken.access_token,
      transformAPIGuildScheduledEventToScheduledEvent(event),
    );
  }
  redirect('/');
}

export async function unlinkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id || !user.isLinkedToCalendar) {
    return;
  }
  const userAndToken = await retrieveUserToken(user.id);
  if (!userAndToken) {
    return;
  }

  await updateIsLinkedToCalendar(user.id as string, false);

  const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_BOT_TOKEN as string,
  );
  const events = (await rest.get(
    Routes.guildScheduledEvents(process.env.DISCORD_GUILD_ID as string),
  )) as APIGuildScheduledEvent[];
  for (const event of events) {
    removeCalEvent(userAndToken.access_token, event);
  }
  redirect('/');
}
