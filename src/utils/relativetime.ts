// Humans read "3 days ago", not "Nov 4, 2:30 PM" - used in activity feeds.
export function relativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hhmm = then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;

  const sameDay = then.toDateString() === now.toDateString();
  if (sameDay) return `today at ${hhmm}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (then.toDateString() === yesterday.toDateString()) return `yesterday at ${hhmm}`;

  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

  return then.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
