export interface ScheduledEvent {
  id: string;
  name: string;
  description?: string | null;
  starttime: Date;
  endtime?: Date | null;
  creatorid?: string | null;
  location?: string | null;
  recurrence?: string | null;
  url?: string | null;
}
