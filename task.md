# GGABA - Interior Estimate Platform (Phase 1 MVP) Master Plan

> **프로젝트:** 인테리어 견적 진단 플랫폼 (바가지 점수 분석)
> **Core Loop:** 진단(Diagnosis) → 공유(Share) → 피드백(Feedback)
> **Tech:** Next.js 14 App Router / TypeScript / Supabase / Drizzle ORM / Zustand / TanStack Query v5 / shadcn/ui
> **Updated:** 2026-02-17

---

## Phase 0: Database & Schema Design (The Backbone)

> **상태:** ✅ 완료. Supabase에 6 테이블 + 4 enum + 2 Storage 버킷 배포 완료.

- [x] Drizzle ORM 패키지 생성 (`packages/db`)
- [x] `users` 테이블 정의 — UUID, email, nickname, role(user/admin/partner), tier(free/basic/premium), points
- [x] `estimates` 테이블 정의 — userId FK, status(pending/diagnosing/diagnosed/expired), totalPrice, badPriceScore, region, sizePyeong, 프라이버시 마스킹 플래그
- [x] `estimate_items` 테이블 정의 — **4-tier 계층 구조**: category(대분류) → detail(세부항목) → unit(단위) → unitPrice(단가), quantity, totalPrice, sortOrder, AI 분석 필드(priceRating, marketPriceLow/High)
- [x] `community_posts` 테이블 정의 — type(review/share/qna), estimateId FK(optional), 프라이버시 마스킹 플래그, viewCount, likeCount
- [x] `comments` 테이블 정의 — postId FK, parentId(대댓글), content
- [x] `reviews` 테이블 정의 — userId(작성자), partnerId(시공사), rating, content (Phase 3 역경매 대비)
- [x] Drizzle relations 정의 (모든 테이블 간 1:N, N:1 관계)
- [x] DB 클라이언트 설정 (`client.ts` — globalThis 캐싱, postgres.js, max:1, prepare:false)
- [x] **`.env.example` 설정 가이드 작성** (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [x] **Drizzle 마이그레이션 생성:** `pnpm --filter @ggaba/db db:generate` → `0000_glossy_celestials.sql` (6 테이블, 4 enum, 9 FK)
- [x] **Supabase Setup 스크립트 작성** — `scripts/setup.sh` (db:push + storage 한번에), `scripts/setup-storage.ts` (버킷 생성)
- [x] **Supabase 프로젝트 연결 완료** → `.env.local` 설정, 마이그레이션 실행 (6 테이블 + 4 enum), Storage 버킷 생성 (`estimate-files`, `profile-images`)

---

## Phase 1: Authentication & Layout

> **상태:** ✅ 완료. Supabase Auth 연동, 소셜 로그인, 보호 라우트, 유저 자동 생성 구현.

### 1-1. Supabase Auth 설정

- [x] `@supabase/supabase-js` 및 `@supabase/ssr` 설치 (`apps/web`)
- [x] Supabase 클라이언트 유틸리티 생성:
  - [x] `src/lib/supabase/client.ts` — 브라우저용 클라이언트 (`createBrowserClient`)
  - [x] `src/lib/supabase/server.ts` — Server Component/Action용 클라이언트 (`createServerClient` with cookies)
  - [x] `src/lib/supabase/middleware.ts` — 세션 갱신 + 보호 라우트 로직
- [x] `middleware.ts` (root) — Supabase 세션 갱신 + 보호 라우트 리다이렉트 (`/diagnosis`, `/vault`, `/mypage`는 로그인 필수)
- [x] 소셜 로그인 구현 (코드 완료, Dashboard 설정은 별도):
  - [ ] ⏳ Kakao OAuth 설정 (Supabase Dashboard → Auth → Providers)
  - [ ] ⏳ Naver OAuth 설정 (GitHub로 대체 가능)
  - [ ] ⏳ Google OAuth 설정
- [x] `/login` 페이지 — 소셜 로그인 버튼 3개 (Kakao/GitHub/Google), 로고, 서비스 소개 문구
- [x] `/auth/callback` 라우트 — OAuth 콜백 처리 (`code` → session exchange)
- [x] Auth 상태 기반 UI 분기:
  - [x] 로그인 전: middleware에서 보호 라우트 접근 시 `/login?redirect=`로 리다이렉트
  - [x] 로그인 후: 정상 네비게이션, `/login` 접근 시 홈으로 리다이렉트
- [x] 신규 유저 가입 시 `users` 테이블에 자동 row 생성 (`/auth/callback`에서 upsert)
- [x] `useAuth` 훅 — 클라이언트 auth 상태 추적, signOut 기능

### 1-2. 레이아웃 (완료)

- [x] `MobileLayout` 구현 — max-w-lg 컨테이너, BottomNav, Toaster
- [x] `BottomNav` 컴포넌트 — 5탭(홈/진단/커뮤니티/금고/마이), active 상태, safe-area-inset
- [x] Pretendard 폰트 CDN 로드
- [x] 디자인 토큰 CSS 변수 (Deep Teal primary, safe/warning/danger 시맨틱)
- [x] QueryClientProvider + TanStack Query 설정

---

## Phase 2: Core Feature — Estimate Diagnosis (킬러 피처)

> **상태:** ✅ 완료. 5-step 위저드, Mock OCR, 가격 분석, Server Actions 구현 완료.

### 2-0. 진단 플로우 라우트 구조

- [x] `/diagnosis` 라우트 그룹 생성:
  - [x] `/diagnosis` — 진단 시작 랜딩 (CTA 버튼)
  - [x] `/diagnosis/flow` — 멀티스텝 위저드 (upload → masking → info → verify → result)
  - [x] `/diagnosis/result/[id]` — 진단 결과 상세 페이지

### 2-1. Step 1 — 견적서 업로드 (Upload)

- [x] 업로드 UI 구현 (`/diagnosis/flow` 내 step 0):
  - [x] 다중 이미지 업로드 지원 (최대 5장), 드래그앤드롭, 카메라
  - [x] 업로드된 이미지 썸네일 목록 + 삭제 기능
- [x] Supabase Storage 업로드 Server Action:
  - [x] `src/app/diagnosis/_actions/upload.ts` — 이미지를 `estimate-files` 버킷에 업로드
  - [x] 업로드 후 public URL 반환
- [x] `useDiagnosisStore.addImage/removeImage` 호출로 상태 저장

### 2-2. Step 2 — 개인정보 마스킹 (Masking)

- [x] 마스킹 UI 구현 (`/diagnosis/flow` 내 step 1):
  - [x] Canvas 기반 이미지 위에 "문지르기" 블러 도구 (박스 블러)
  - [x] 터치/마우스 드래그로 민감 정보 영역 블러 처리
  - [x] 브러시 크기 조절, 이미지 초기화 기능
- [x] 마스킹 옵션 저장: `useDiagnosisStore.setMasking()`

### 2-3. Step 3 — 추가 정보 입력 (Info)

- [x] 정보 입력 폼 구현 (`/diagnosis/flow` 내 step 2):
  - [x] React Hook Form + Zod 연동
  - [x] 필드: 지역(region) Select, 건물유형(buildingType) Select, 평수(sizePyeong) 숫자 입력
  - [x] 제목(title) — 자동 생성 ("마포구 24평 아파트 견적")
- [x] `useDiagnosisStore.setUserInput()` 호출로 상태 저장
- [x] Zod 스키마 검증 (`packages/lib/schemas/diagnosis.ts`에 `diagnosisInfoSchema` 추가)

### 2-4. Step 4 — 항목 검증 (Verify) — Human-in-the-loop

- [x] Mock OCR 함수 구현:
  - [x] `src/lib/mock-ocr.ts` — 13개 샘플 견적 항목 반환
  - [x] 시세 데이터 및 가격 등급 산출 함수 (`getPriceRating`, `calculateBadPriceScore`)
- [x] 항목 검증 UI 구현 (`/diagnosis/flow` 내 step 3):
  - [x] 카테고리별 그룹핑 + 소계 표시
  - [x] 행 인라인 편집 기능 (Pencil → Input 변환)
  - [x] 행 추가/삭제 버튼
  - [x] 전체 합계 표시
- [x] `useDiagnosisStore.updateLineItem()`, `removeLineItem()`, `addLineItem()` 연동

### 2-5. Step 5 — 진단 결과 (Result)

- [x] 진단 제출 Server Action:
  - [x] `src/app/diagnosis/_actions/submit.ts` — estimates + estimate_items 테이블에 INSERT
  - [x] Mock 분석 로직: 각 항목의 unitPrice를 시세 범위와 비교하여 priceRating 산출
  - [x] 전체 badPriceScore 계산 (금액 가중치 기반)
  - [x] 경고 메시지 자동 생성 (시세 초과, 항목 누락 감지)
- [x] 결과 페이지 UI:
  - [x] `BagajiScore` 게이지 — 전체 바가지 점수
  - [x] 분석 요약 카드 + 경고 알림
  - [x] 항목별 분석 테이블 (priceRating 컬러링, 시세 범위)
  - [x] 액션 버튼: "커뮤니티에 공유" / "상세 결과 보기" / "새로 진단하기"
- [x] TanStack Query 훅: `useEstimateDetail(id)` — 견적 상세 + items 조회
- [x] `/diagnosis/result/[id]` — 저장된 진단 결과 상세 페이지

### 2-6. 진단 플로우 통합

- [x] `/diagnosis/flow/page.tsx` — MultiStepForm + StepNavigation 연동
  - [x] `useDiagnosisStore.currentStep`에 따라 Step 1~5 조건부 렌더링
  - [x] 스텝별 유효성 검증 후 다음 단계 진행 허용
  - [x] Toast로 유효성 실패 메시지 표시

---

## Phase 3: Community & Feed

> **상태:** ✅ 완료. 피드 목록, 상세, 댓글/대댓글, 게시글 작성 구현.

### 3-1. 커뮤니티 피드 목록

- [x] `/community` 페이지:
  - [x] 탭 필터: 전체 / 견적공유(share) / 시공후기(review) / 질문(qna)
  - [x] 피드 카드 컴포넌트 (`CommunityCard`): 작성자, 제목, 내용 미리보기, 견적 요약, 통계
  - [x] 무한 스크롤 (TanStack Query `useInfiniteQuery` + Intersection Observer)
  - [x] 빈 상태 UI
- [x] Server Action: `getPosts(type?, cursor?)` — 커서 기반 페이지네이션
- [x] TanStack Query 훅: `useCommunityPosts(type?)`

### 3-2. 커뮤니티 상세 페이지

- [x] `/community/[id]` 페이지:
  - [x] 게시글 본문 + 작성자 정보
  - [x] 연결된 견적 테이블 (BagajiScore, 항목별 분석)
  - [x] 투표 버튼: "싸다 / 적당하다 / 비싸다" (Toast)
  - [x] 댓글 목록 (대댓글 지원)
  - [x] 댓글 작성 폼 (로그인 필수, Enter로 전송)
- [x] Server Actions: `getPost(id)`, `addComment(postId, content, parentId?)`

### 3-3. 게시글 작성

- [x] `/community/write` 페이지:
  - [x] 게시글 유형 선택 (견적공유 / 시공후기 / 질문)
  - [x] 제목, 본문 입력 (React Hook Form + Zod)
  - [x] "금고에서 견적 첨부" — 내 진단 결과 목록에서 선택
  - [x] 프라이버시 마스킹 옵션 (가격 마스킹)
- [x] Server Action: `createPost(data)` — community_posts INSERT

---

## Phase 4: Home & My Page

> **상태:** ✅ 완료. 홈 고도화, 금고, 마이페이지 구현.

### 4-1. 홈 페이지 고도화

- [x] 히어로 섹션: CTA → `/diagnosis`로 이동
- [x] 실시간 티커 위젯: "마포구 24평 방금 분석 완료" (3초 간격 슬라이드, Server Component fetch)
- [x] 서비스 통계: 총 진단 수, 평균 바가지 점수 (Server Component)
- [x] 인기 커뮤니티 게시글 3건 카드 (조회수 기준)
- [x] BagajiScore 예시 (실제 평균 점수 반영)

### 4-2. 금고 (Vault) 페이지

- [x] `/vault` 페이지:
  - [x] 내 견적 목록 (카드: 제목, 지역, 평수, 바가지 점수, 날짜, 상태 뱃지)
  - [x] 카드 클릭 → `/diagnosis/result/[id]`
  - [x] 빈 상태 UI + CTA
- [x] Server Action: `getMyEstimates()`

### 4-3. 마이 페이지

- [x] `/mypage` 페이지:
  - [x] 프로필 섹션: 닉네임(인라인 편집), 이메일, 프로필 이미지, 티어 뱃지
  - [x] 포인트 현황 (표시)
  - [x] 내 활동 탭: 내 게시글 / 내 댓글
  - [x] 로그아웃 버튼
- [x] Server Actions: `getProfile()`, `updateProfile()`, `getMyPosts()`, `getMyComments()`

---

## Phase 5: Polish & Refinement

> **상태:** ✅ 완료 (배포 제외). 규칙 기반 알림, UX 개선, 성능 최적화 구현.

### 5-1. 규칙 기반 자동 알림 (Rule-based Alerts)

- [x] 알림 규칙 엔진 (`src/lib/alert-rules.ts`):
  - [x] 누락 항목 경고: 철거, 방수, 전기, 폐기물 처리
  - [x] 인건비 비율 체크 (35% 초과 시 경고)
  - [x] 개별 항목 과다 단가 (시세 2배 이상 시 danger)
  - [x] 전체 합계 과다 체크 (5천만원 초과 시 info)
  - [x] 저가 항목 다수 경고 (3개 이상 시 품질 확인)
- [x] 진단 결과 페이지에 type별(danger/warning/info) 알림 카드 표시

### 5-2. UX 개선

- [x] Skeleton: 커뮤니티 목록/상세, 금고 목록, 진단 결과, 마이페이지
- [x] Toast: 업로드, 진단 완료, 게시글 작성, 댓글 작성, 프로필 수정, 유효성 실패
- [x] 에러 바운더리: `error.tsx` (전역), `not-found.tsx` (404)
- [x] 빈 상태: 커뮤니티 없음, 금고 없음, 댓글 없음, 게시글/댓글 없음

### 5-3. 성능 최적화

- [x] 이미지 최적화: `next.config.mjs` remotePatterns (Supabase, Google, GitHub, Kakao)
- [x] 코드 스플리팅: 진단 플로우 5개 Step `dynamic import` (143kB → 115kB)

### 5-4. 배포

- [ ] ⏳ Vercel 환경 변수 설정 (수동)
- [ ] ⏳ Production 배포 (수동)

---

## 참고: 기 구현 완료 항목 요약

| 영역 | 완료 항목 |
|------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces, 6 패키지 구조 |
| **DB** | Drizzle 스키마 6 테이블 + 4 enum, Supabase 마이그레이션 완료, 2 Storage 버킷 |
| **UI** | 13개 컴포넌트 (Button, Card, Input, Progress, Skeleton, Toast, BottomNav, FileUpload, MultiStepForm, BagajiScore, Table) |
| **Lib** | cn(), formatDate/Currency, Zod 스키마 (estimate, diagnosis) |
| **Config** | ESLint, TypeScript(base/nextjs/library), Tailwind(Deep Teal 테마) |
| **Auth** | Supabase Auth (SSR), 소셜 로그인 (Kakao/GitHub/Google), 보호 라우트, 유저 자동 생성 |
| **진단** | 5-step 위저드, Mock OCR, 가격 분석, 규칙 기반 알림, Server Actions, dynamic import |
| **커뮤니티** | 피드(무한스크롤), 상세(댓글/대댓글, 투표), 게시글 작성(견적 첨부) |
| **홈** | 실시간 티커, 서비스 통계, 인기 게시글, Server Component |
| **금고** | 내 견적 목록, 상태 뱃지, 빈 상태 UI |
| **마이페이지** | 프로필(인라인 편집), 포인트, 내 활동 탭, 로그아웃 |
| **UX** | Skeleton, Toast, 에러 바운더리(error.tsx), 404, 빈 상태 UI |
| **성능** | dynamic import (코드 스플리팅), next/image remotePatterns |
