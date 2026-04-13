import { NextRequest, NextResponse } from 'next/server';
import { crawlNavLinks } from '@/lib/crawler';

// 크롤링은 최대 30초 허용
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const { url } = body as { url?: string };

  if (!url || typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  // URL 형식 기본 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: 'http 또는 https URL만 지원합니다.' },
      { status: 400 }
    );
  }

  try {
    const links = await crawlNavLinks(parsedUrl.toString());
    return NextResponse.json({ links });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
