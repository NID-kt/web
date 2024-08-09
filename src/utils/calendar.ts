import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';

export async function linkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || user.isLinkedToCalendar) {
    return;
  }

  await sql`
    UPDATE users SET
      "isLinkedToCalendar" = true
    WHERE
      id = ${user.id};
  `;
  redirect('/');
}

export async function unlinkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.isLinkedToCalendar) {
    return;
  }

  await sql`
    UPDATE users SET
      "isLinkedToCalendar" = false
    WHERE
      id = ${user.id};
  `;
  redirect('/');
}
