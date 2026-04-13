// 서버 전용 — 클라이언트 컴포넌트에서 import 금지
import { chromium } from 'playwright';
import type { LinkNode } from './types';

interface RawLink {
  href: string;
  text: string;
  depth: number;
}

// 깊이 배열로부터 중첩 트리 구조 생성
function buildTree(links: RawLink[]): LinkNode[] {
  const root: LinkNode[] = [];
  const stack: LinkNode[] = [];

  for (const link of links) {
    const node: LinkNode = { href: link.href, text: link.text, depth: link.depth, children: [] };

    // 현재 깊이보다 같거나 깊은 항목을 스택에서 제거
    while (stack.length > 0 && stack[stack.length - 1].depth >= link.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

export async function crawlNavLinks(targetUrl: string): Promise<LinkNode[]> {
  // 사전 설치된 Chromium 경로 설정 (다운로드 제한 환경)
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/pw-browsers';
  }

  const base = new URL(targetUrl);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 브라우저 컨텍스트에서 네비게이션 링크 추출
    const rawLinks: Array<{ href: string; text: string; depth: number }> = await page.evaluate(
      () => {
        // 네비게이션 요소 수집 — 시맨틱 요소 우선
        const candidates = [
          ...Array.from(document.querySelectorAll('nav')),
          ...Array.from(document.querySelectorAll('[role="navigation"]')),
        ];

        // 다른 nav의 자식인 요소는 제외 (최상위 nav만 유지)
        const navElements = candidates.filter(
          (el) => !candidates.some((other) => other !== el && other.contains(el))
        );

        // nav 없으면 header 내부 ul로 폴백
        const targets =
          navElements.length > 0
            ? navElements
            : Array.from(document.querySelectorAll('header ul, .nav, .navbar, .navigation'));

        const links: Array<{ href: string; text: string; depth: number }> = [];
        const seenHrefs = new Set<string>();

        for (const nav of targets) {
          const anchors = nav.querySelectorAll('a[href]');

          anchors.forEach((a) => {
            const anchor = a as HTMLAnchorElement;
            // anchor.href는 브라우저가 절대 URL로 변환한 값
            const href = anchor.href;
            // 아이콘 전용 링크 처리: textContent → aria-label → title 순으로 폴백
            const text = (
              anchor.textContent?.trim().replace(/\s+/g, ' ') ||
              anchor.getAttribute('aria-label') ||
              anchor.getAttribute('title') ||
              ''
            ).trim();

            if (!href || !text) return;

            // ul/ol 중첩 수로 깊이 계산
            let depth = 0;
            let el: Element | null = anchor.parentElement;
            while (el && el !== nav) {
              if (el.tagName === 'UL' || el.tagName === 'OL') depth++;
              el = el.parentElement;
            }

            if (!seenHrefs.has(href)) {
              seenHrefs.add(href);
              // 최초 ul은 단순 컨테이너이므로 -1 보정
              links.push({ href, text, depth: Math.max(0, depth - 1) });
            }
          });
        }

        return links;
      }
    );

    // Node.js 컨텍스트에서 URL 정규화·필터링
    const filtered: RawLink[] = [];
    const seenNormalized = new Set<string>();

    for (const link of rawLinks) {
      try {
        const u = new URL(link.href);

        // 동일 도메인만 허용
        if (u.hostname !== base.hostname) continue;
        // 지원하지 않는 프로토콜 제외
        if (['mailto:', 'tel:', 'javascript:'].includes(u.protocol)) continue;
        // 순수 앵커 링크 제외 (동일 페이지 내 해시 이동)
        if (u.pathname === base.pathname && u.hash && !u.search) continue;

        // 정규화: 트레일링 슬래시 통일, 해시 제거
        const normalized = `${u.origin}${u.pathname.replace(/\/$/, '') || '/'}${u.search}`;

        if (!seenNormalized.has(normalized)) {
          seenNormalized.add(normalized);
          filtered.push({ href: normalized, text: link.text, depth: link.depth });
        }
      } catch {
        continue;
      }
    }

    return buildTree(filtered);
  } finally {
    await browser.close();
  }
}
