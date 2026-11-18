import { experienceCalendar } from '../../../../lib/experience-downloads';

export async function GET(_request: Request, { params }: { params: Promise<{ experience: string }> }) {
  const { experience } = await params;
  const calendar = experienceCalendar(experience);
  if (!calendar) return new Response('Experience not found', { status: 404 });

  return new Response(calendar, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Compleanno-FDB-' + experience + '.ics"',
    },
  });
}
