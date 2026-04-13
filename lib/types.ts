// 공유 타입 정의 — 서버(crawler.ts)와 클라이언트(MenuTree, page.tsx) 모두에서 사용
export interface LinkNode {
  href: string;
  text: string;
  depth: number;
  children: LinkNode[];
}
