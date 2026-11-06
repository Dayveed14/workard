// Meeting times are wall-clock times in the business's timezone ("2026-11-06 09:00")
const at = (date, hhmm) => new Date(`${date}T${hhmm}:00`);
export const JOIN_EARLY_MINUTES = 15;

// Can you join this occurrence right now? (15 min before → an hour after the end)
export function joinState(occ, now = new Date()) {
  const start = at(occ.date, occ.startsAt.slice(11, 16));
  const opens = new Date(start.getTime() - JOIN_EARLY_MINUTES * 60_000);
  const ends = new Date(start.getTime() + occ.durationMinutes * 60_000);
  const closes = new Date(ends.getTime() + 60 * 60_000);
  if (now < opens) return { state: 'later', start, ends };
  if (now > closes) return { state: 'over', start, ends };
  return { state: now < start ? 'soon' : now <= ends ? 'live' : 'running-late', start, ends };
}

export const hhmm = (d) => d.toTimeString().slice(0, 5);
