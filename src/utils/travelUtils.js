export function countryFlag(code) {
  const c = (code || '').toUpperCase();
  if (c === 'IN') return '🇮🇳';
  if (c === 'DE') return '🇩🇪';
  return '🌍';
}

export function formatTravelDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function groupEventsByMonth(events) {
  const groups = {};
  for (const ev of events || []) {
    const d = new Date(`${ev.travel_date}T12:00:00`);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Split into upcoming (soonest first) and past (most recent first), each grouped by month. */
export function splitAndGroupEvents(events) {
  const today = todayIso();
  const upcoming = [];
  const past = [];
  for (const ev of events || []) {
    if (ev.travel_date >= today) upcoming.push(ev);
    else past.push(ev);
  }
  upcoming.sort((a, b) => a.travel_date.localeCompare(b.travel_date));
  past.sort((a, b) => b.travel_date.localeCompare(a.travel_date));
  return {
    upcomingGroups: groupEventsByMonth(upcoming),
    pastGroups: groupEventsByMonth(past),
  };
}
