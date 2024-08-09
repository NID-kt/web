import type { APIGuildScheduledEvent } from 'discord-api-types/v10';
import { convertRFC5545RecurrenceRule } from './recurrenceUtil';
import type { ScheduledEvent } from './types';

// APIGuildScheduledEvent -> ScheduledEvent
export function transformAPIGuildScheduledEventToScheduledEvent(
  event: APIGuildScheduledEvent,
): ScheduledEvent {
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    starttime: new Date(event.scheduled_start_time),
    endtime: event.scheduled_end_time
      ? new Date(event.scheduled_end_time)
      : null,
    creatorid: event.creator_id ?? null,
    location: event.entity_metadata?.location ?? null,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    recurrence: (event as any).recurrence_rule
      ? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        convertRFC5545RecurrenceRule((event as any).recurrence_rule)
      : null,
    url: `https://discord.com/events/${event.guild_id}/${event.id}`,
  };
}
