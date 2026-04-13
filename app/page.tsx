'use client';

import { useState } from 'react';
import { MenuTree } from '@/components/MenuTree';
import type { LinkNode } from '@/lib/types';

function countLinks(nodes: LinkNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countLinks(node.children), 0);
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setLinks(null);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '크롤링 중 오류가 발생했습니다.');
      } else {
        setLinks(data.links);
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const total = links ? countLinks(links) : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">URL 메뉴 트리 추출기</h1>
        <p className="text-sm text-gray-500 mb-8">
          웹사이트 URL을 입력하면 내비게이션 구조를 분석해 메뉴 트리로 표시합니다.
        </p>

        {/* URL 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '분석 중…' : '분석'}
          </button>
        </form>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-sm text-gray-500 text-center py-10">
            헤드리스 브라우저로 사이트를 분석 중입니다…
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 결과 트리 */}
        {links && !loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                메뉴 트리
                <span className="ml-2 text-gray-400 font-normal">{total}개 링크 발견</span>
              </h2>
            </div>

            {total === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                네비게이션 링크를 찾을 수 없습니다.
              </p>
            ) : (
              <MenuTree nodes={links} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
