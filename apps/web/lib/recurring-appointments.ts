export function generateOccurrenceDates(
  frequency: string,
  interval: number,
  dayOfWeek: number | null,
  daysOfWeek: number[] | null,
  dayOfMonth: number | null,
  startDate: Date,
  endDate: Date | null,
  occurrences: number | null,
  startTimeStr: string,
): Date[] {
  const [h, m] = startTimeStr.split(':').map(Number);
  const MAX_CAP = 104;
  const limit = occurrences ?? MAX_CAP;
  const dates: Date[] = [];

  function setTime(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(h, m, 0, 0);
    return copy;
  }

  function addDays(d: Date, n: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  if (frequency === 'DAILY') {
    let d = setTime(new Date(startDate));
    while (dates.length < limit && (!endDate || d <= endDate)) {
      dates.push(new Date(d));
      d = addDays(d, interval);
    }
    return dates;
  }

  if (frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') {
    const weekStep = frequency === 'FORTNIGHTLY' ? 2 * interval : interval;
    const targets = daysOfWeek?.length ? daysOfWeek : dayOfWeek !== null && dayOfWeek !== undefined ? [dayOfWeek] : [startDate.getDay()];

    let weekAnchor = new Date(startDate);
    weekAnchor.setHours(0, 0, 0, 0);
    weekAnchor.setDate(weekAnchor.getDate() - weekAnchor.getDay());

    while (dates.length < limit) {
      for (const dow of targets.sort((a, b) => a - b)) {
        const d = setTime(addDays(weekAnchor, dow));
        if (d >= setTime(new Date(startDate)) && d >= new Date(startDate) && (!endDate || d <= endDate)) {
          dates.push(d);
          if (dates.length >= limit) break;
        }
      }
      weekAnchor = addDays(weekAnchor, 7 * weekStep);
      if (endDate && weekAnchor > endDate) break;
    }
    return dates;
  }

  if (frequency === 'MONTHLY') {
    let d = new Date(startDate);
    d.setHours(h, m, 0, 0);
    if (dayOfMonth) {
      d.setDate(dayOfMonth);
      if (d < new Date(startDate)) d.setMonth(d.getMonth() + interval);
    }
    while (dates.length < limit && (!endDate || d <= endDate)) {
      dates.push(new Date(d));
      d = new Date(d);
      d.setMonth(d.getMonth() + interval);
    }
    return dates;
  }

  return dates;
}
