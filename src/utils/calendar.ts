import { auth } from '@/auth';
import { Pool } from '@neondatabase/serverless';
import { redirect } from 'next/navigation';

export async function linkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || user.isLinkedToCalendar) {
    return;
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  await pool.query(
    `
    UPDATE users SET
      "isLinkedToCalendar" = true
    WHERE
      id = $1
    `,
    [user.id],
  );
  redirect('/');
}

export async function unlinkCalendar() {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.isLinkedToCalendar) {
    return;
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  await pool.query(
    `
    UPDATE users SET
      "isLinkedToCalendar" = false
    WHERE
      id = $1
    `,
    [user.id],
  );
  redirect('/');
}
