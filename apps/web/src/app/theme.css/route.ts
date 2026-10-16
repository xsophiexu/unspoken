import { themeCss } from '@/theme/css';

// The design-token stylesheet, written to /theme.css at build time.
export const dynamic = 'force-static';

export function GET() {
  return new Response(themeCss(), { headers: { 'content-type': 'text/css; charset=utf-8' } });
}
