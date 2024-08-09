export interface ScheduledEvent {
  id: string;
  name: string;
  description?: string | undefined | null;
  starttime: Date;
  endtime?: Date | undefined | null;
  creatorid?: string | undefined | null;
  location?: string | undefined | null;
  recurrence?: string | undefined | null;
  url?: string | undefined | null;
}
