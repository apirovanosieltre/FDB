const calendarStart = '20270220T190000Z'; // 20 February 2027 at 20:00 in Europe/Rome.
const location = 'Hotel Vallunga, Campo Tartano';

const experiences = {
  dinner: { title: 'Dinner with Barbie', pdf: '/experiences/dinner-with-barbie.pdf' },
  sleepover: { title: 'Barbie Sleepover', pdf: '/experiences/barbie-sleepover.pdf' },
};

export function experienceDownloads(experience: string) {
  if (experience !== 'dinner' && experience !== 'sleepover') return null;

  const { title, pdf } = experiences[experience];
  const summary = 'Compleanno FDB — ' + title;
  const description = 'Confirmed experience: ' + title + '. Dress code: Think pink! Contact the organiser for arrangements.';
  const google = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: calendarStart + '/' + calendarStart,
    details: description,
    location,
    ctz: 'Europe/Rome',
  });

  return {
    pdf,
    ics: '/api/calendar/' + experience,
    google: 'https://calendar.google.com/calendar/render?' + google.toString(),
    summary,
    description,
  };
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let length = 0;
  let folded = '';
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) {
      folded += '\r\n ';
      length = 1;
    }
    folded += character;
    length += bytes;
  }
  return folded;
}

export function experienceCalendar(experience: string, now = new Date()) {
  const details = experienceDownloads(experience);
  if (!details) return null;

  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FDB//Birthday Club//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:fdb-20270220-' + experience + '@birthday-club',
    'DTSTAMP:' + stamp,
    'DTSTART:' + calendarStart,
    'SUMMARY:' + escapeCalendarText(details.summary),
    'DESCRIPTION:' + escapeCalendarText(details.description),
    'LOCATION:' + escapeCalendarText(location),
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].map(foldCalendarLine).join('\r\n');
}
