'use client';

import { useState } from 'react';
import type { LinkNode } from '@/lib/types';

interface MenuNodeProps {
  node: LinkNode;
}

function MenuNode({ node }: MenuNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1.5 py-0.5">
        {/* 자식 있을 때만 토글 버튼 표시 */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-4 text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 leading-none"
            aria-label={expanded ? '접기' : '펼치기'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
          title={node.href}
        >
          {node.text}
        </a>

        <span className="text-xs text-gray-400 truncate hidden md:block min-w-0">
          — {node.href}
        </span>
      </div>

      {hasChildren && expanded && (
        <ul className="pl-5 border-l border-gray-200 ml-1.5">
          {node.children.map((child, i) => (
            <MenuNode key={`${child.href}-${i}`} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

interface MenuTreeProps {
  nodes: LinkNode[];
}

export function MenuTree({ nodes }: MenuTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node, i) => (
        <MenuNode key={`${node.href}-${i}`} node={node} />
      ))}
    </ul>
  );
}
