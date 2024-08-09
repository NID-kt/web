// Google Calendarの操作用

import type { ScheduledEvent } from './types';

function createSchemaEvent(event: ScheduledEvent) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const body: any = {
    location: event.location,
    id: event.id,
    summary: event.name,
    description: event.description,
    start: {
      dateTime: event.starttime.toISOString(),
      timeZone: 'Asia/Tokyo',
    },
    end: {
      // starttimeの１時間後
      dateTime: new Date(
        event.starttime.getTime() + 60 * 60 * 1000,
      ).toISOString(),
      timeZone: 'Asia/Tokyo',
    },
    source: {
      url: event.url ?? undefined,
      title: event.name,
    },
  };

  if (event.recurrence) {
    body.recurrence = [event.recurrence];
  }

  return body;
}

export async function createCalEvent(
  access_token: string,
  event: ScheduledEvent,
) {
  const body = createSchemaEvent(event);

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: body,
    },
  );

  // すでに存在する場合, UIから削除した場合、キャンセル扱いになる
  if (res.status === 409) {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: body,
      },
    );
  }
}

export async function updateCalEvent(
  access_token: string,
  event: ScheduledEvent,
) {
  const body = createSchemaEvent(event);
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: body,
    },
  );
}

export async function removeCalEvent(
  access_token: string,
  event: Pick<ScheduledEvent, 'id'>,
) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );
}
