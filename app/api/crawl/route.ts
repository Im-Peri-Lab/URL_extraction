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
    const message = error instanceof Error ? error.message : '';

    // 타임아웃 (Playwright: "Timeout Xms exceeded")
    if (message.includes('Timeout') || message.includes('timeout')) {
      return NextResponse.json(
        { error: '사이트 응답이 15초를 초과했습니다.', errorCode: 'TIMEOUT' },
        { status: 408 }
      );
    }

    // 비HTML 콘텐츠 (PDF, 이미지 등)
    if (message.startsWith('UNSUPPORTED_CONTENT_TYPE:')) {
      const mimeType = message.replace('UNSUPPORTED_CONTENT_TYPE:', '');
      return NextResponse.json(
        {
          error: `HTML 페이지가 아닙니다 (${mimeType}). 일반 웹페이지 URL을 입력해주세요.`,
          errorCode: 'UNSUPPORTED_CONTENT',
        },
        { status: 422 }
      );
    }

    // 네트워크 / DNS 오류 (Playwright: "net::ERR_NAME_NOT_RESOLVED" 등)
    if (
      message.includes('net::ERR') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ECONNRESET')
    ) {
      return NextResponse.json(
        { error: '사이트에 연결할 수 없습니다. URL이 올바른지, 사이트가 운영 중인지 확인해주세요.', errorCode: 'NETWORK_ERROR' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: '크롤링 중 예상치 못한 오류가 발생했습니다.', errorCode: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
