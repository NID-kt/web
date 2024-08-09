export type APIRecurrenceRuleFrequency = 0 | 1 | 2 | 3;
export type APIRecurrenceRuleWeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type APIRecurrenceRuleMonth =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

export interface APIRecurrenceRule {
  start: Date;
  end?: Date | undefined | null;
  frequency: APIRecurrenceRuleFrequency;
  interval: number;
  by_weekday?: APIRecurrenceRuleWeekDay[] | undefined | null;
  by_n_weekday?:
    | { n: 1 | 2 | 3 | 4 | 5; day: APIRecurrenceRuleWeekDay }[]
    | undefined
    | null;
  by_month?: APIRecurrenceRuleMonth[] | undefined | null;
  by_month_day?: number[] | undefined | null;
  by_year_day?: number[] | undefined | null;
  count?: number | undefined | null;
}

export function getWeekdayString(weekday: APIRecurrenceRuleWeekDay): string {
  // https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-weekday
  // 月曜始まり
  return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][weekday];
}

export function getFrequencyString(
  frequency: APIRecurrenceRuleFrequency,
): string {
  return ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'][frequency];
}

// https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10
export function convertRFC5545RecurrenceRule(
  rule: APIRecurrenceRule,
): string | undefined {
  const { by_weekday, by_n_weekday, by_month, by_month_day, by_year_day } =
    rule;
  let str = `RRULE:FREQ=${getFrequencyString(rule.frequency)};INTERVAL=${rule.interval}`;

  if (by_weekday) {
    str += `;BYDAY=${by_weekday.map((day) => getWeekdayString(day)).join(',')}`;
  }
  if (by_n_weekday) {
    str += `;BYDAY=${by_n_weekday.map((day) => `${day.n}${getWeekdayString(day.day)}`).join(',')}`;
  }
  if (by_month) {
    str += `;BYMONTH=${by_month.join(',')}`;
  }
  if (by_month_day) {
    str += `;BYMONTHDAY=${by_month_day.join(',')}`;
  }
  if (by_year_day) {
    str += `;BYYEARDAY=${by_year_day.join(',')}`;
  }

  if (rule.end) {
    str += `;UNTIL=${rule.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  }
  if (rule.count) {
    str += `;COUNT=${rule.count}`;
  }

  return str;
}
