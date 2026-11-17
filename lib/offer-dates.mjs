const timeZone = 'Asia/Qatar';
const inputFormatter = new Intl.DateTimeFormat('en-CA', {timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const displayFormatter = new Intl.DateTimeFormat('en-GB', {timeZone,day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});

export function toQatarDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(inputFormatter.formatToParts(date).map(part => [part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function qatarDateTimeToIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a valid Qatar date and time.');
  // Qatar uses UTC+03:00 without daylight-saving changes.
  const date = new Date(value + ':00+03:00');
  if (Number.isNaN(date.getTime()) || toQatarDateTimeInput(date) !== value) throw new Error('Enter a valid Qatar date and time.');
  return date.toISOString();
}

export function formatQatarDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : displayFormatter.format(date);
}

export function offerVisibilityLabel(offer, now = new Date()) {
  if (offer.status !== 'published') return offer.status || 'draft';
  if (offer.starts_at && new Date(offer.starts_at) > now) return `published · starts ${formatQatarDateTime(offer.starts_at)} (Qatar time)`;
  if (offer.ends_at && new Date(offer.ends_at) < now) return `published · ended ${formatQatarDateTime(offer.ends_at)} (Qatar time)`;
  return 'published · visible now';
}
