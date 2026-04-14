# URL Extraction — CLAUDE.md

## 프로젝트 목적 및 대상 사용자

웹사이트 URL을 입력하면 헤드리스 브라우저로 해당 사이트의 내비게이션 구조를 크롤링하고, 발견된 주요 페이지 링크를 사이트 계층 구조를 반영한 메뉴 트리 형태로 화면에 표시하는 웹 도구입니다. 대상 사용자는 사이트맵을 빠르게 파악하거나 IA(정보 아키텍처)를 분석하고자 하는 개발자·기획자입니다.

---

## 기술 스택 (정확한 버전)

| 항목 | 버전 |
|------|------|
| Node.js | 22.22.2 (22.x LTS) |
| npm | 10.9.7 |
| Next.js | 15.3.9 |
| React | 19.x |
| Tailwind CSS | 4.x (`@tailwindcss/postcss`) |
| TypeScript | 5.x |
| Playwright | 1.56.1 |
| ESLint | 9.x (`eslint-config-next`) |
| Prettier | 3.x |

---

## 폴더 구조

```
URL_extraction/
├── app/
│   ├── api/
│   │   └── crawl/
│   │       └── route.ts          # Playwright 크롤링 API 엔드포인트
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # 메인 UI (URL 입력 + 트리 렌더링)
├── components/
│   └── MenuTree.tsx              # 메뉴 트리 표시 컴포넌트
├── lib/
│   └── crawler.ts                # 크롤링 로직 (Playwright 래퍼)
├── public/
├── .env.local                    # PLAYWRIGHT_BROWSERS_PATH 설정
├── .gitignore
├── .prettierrc
├── CLAUDE.md                     # 이 파일
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

> Phase 2 이후 `components/`, `lib/`, `app/api/` 폴더가 추가됩니다.

---

## 실행 / 빌드 / 테스트 명령어

```bash
# 개발 서버 실행 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 코드 포맷
npx prettier --write .
```

---

## 주요 아키텍처 결정 및 근거

1. **Next.js App Router + API Routes**: 프론트엔드와 크롤링 백엔드를 단일 Next.js 프로젝트로 통합. 별도 서버 불필요.
2. **Playwright (서버사이드 전용)**: 헤드리스 크롤링은 Next.js API Route(`app/api/crawl/route.ts`)에서만 실행. 브라우저 클라이언트에서는 절대 호출하지 않음.
3. **Playwright 브라우저 경로**: 다운로드 제한 환경이므로 사전 설치된 Chromium 사용. `.env.local`에 `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` 설정.
4. **TypeScript**: 타입 안전성 확보. API 응답 구조(`LinkNode` 타입 등)를 공유 타입으로 정의.
5. **Tailwind CSS v4**: PostCSS 플러그인 방식(`@tailwindcss/postcss`) 사용.

---

## 알려진 제약 및 주의사항

- `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` 환경 변수가 반드시 설정되어야 Playwright가 Chromium을 찾을 수 있음 (`.env.local` 참조).
- Playwright는 Next.js API Route 서버 컨텍스트에서만 실행 가능. 클라이언트 컴포넌트에서 import 금지.
- 크롤링 대상은 동일 도메인(`hostname` 기준)으로 제한.
- MVP에서는 JavaScript 클릭 이벤트로만 접근 가능한 링크 및 CTA 버튼 링크는 추출하지 않음.
- 타임아웃: 15초 초과 시 에러 반환 (Phase 3 구현).

---

## 현재 Phase 및 진행 상황

### ✅ Phase 1 — Scaffold & CLAUDE.md (완료)
- [x] 런타임 버전 확인 (Node 22.22.2, npm 10.9.7, Playwright 1.56.1)
- [x] Next.js 15.3.9 프로젝트 초기화 (TypeScript, Tailwind, ESLint, App Router)
- [x] Playwright 1.56.1, Prettier 3.x 설치
- [x] `.env.local` — `PLAYWRIGHT_BROWSERS_PATH` 설정
- [x] `.prettierrc` 생성
- [x] CLAUDE.md 생성

### ✅ Phase 2 — Core feature implementation (완료)
- [x] URL 입력 필드 UI (`app/page.tsx` — 폼, 로딩/에러 상태, 결과 표시)
- [x] `/api/crawl` API Route (`app/api/crawl/route.ts` — Playwright 크롤링, URL 유효성 검사)
- [x] `MenuTree` 트리 렌더링 컴포넌트 (`components/MenuTree.tsx` — 접기/펼치기, 재귀 렌더링)
- [x] `lib/types.ts` — 공유 `LinkNode` 타입 분리
- [x] `lib/crawler.ts` — 크롤링 로직 (nav 요소 추출, 깊이 계산, 트리 빌드)
- [x] `app/layout.tsx` — Google Fonts 제거 (네트워크 제한 환경 대응)

### ✅ Phase 3 — Integration & hardening (완료)
- [x] 잘못된 URL / 지원 안 되는 프로토콜 → 400 에러 명확히 표시
- [x] 타임아웃 (>15s) → TIMEOUT errorCode + 재시도 안내 UI
- [x] 빈 결과 (nav 링크 없음) → "네비게이션 링크를 찾을 수 없습니다." 상태 표시
- [x] 비HTML 응답 (PDF/다운로드 등) → UNSUPPORTED_CONTENT errorCode + 안내 메시지
- [x] 연결 불가 (DNS/ECONNREFUSED) → NETWORK_ERROR errorCode
- [x] API errorCode 기반 UI 분기 (`app/page.tsx`)
- [x] 롤백 체크포인트 제안 완료 (`git stash` / `git tag` 안내)

---

## 세션 재개 안내

세션 시작 시 이 파일을 먼저 읽고, 현재 Phase와 완료된 작업을 한 단락으로 요약한 뒤 사용자 확인을 받고 나서 작업을 재개하세요.
