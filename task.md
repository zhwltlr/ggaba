# GGABA - Interior Estimate Platform (Phase 1 MVP) Master Plan

> **프로젝트:** 인테리어 견적 진단 플랫폼 (바가지 점수 분석)
> **Core Loop:** 진단(Diagnosis) → 공유(Share) → 피드백(Feedback)
> **Tech:** Next.js 14 App Router / TypeScript / Supabase / Drizzle ORM / Zustand / TanStack Query v5 / shadcn/ui
> **Updated:** 2026-02-17

---

## Phase 0: Database & Schema Design (The Backbone)

> **상태:** 스키마 및 마이그레이션 준비 완료. Supabase 프로젝트 생성 후 `pnpm --filter @ggaba/db setup` 실행하면 완료.

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
- [ ] ⏳ **Supabase 프로젝트 생성** → `.env.local` 설정 → `pnpm --filter @ggaba/db setup` 실행 (Supabase 프로젝트 필요)

---

## Phase 1: Authentication & Layout

> **상태:** 레이아웃 완료. 인증 미구현.

### 1-1. Supabase Auth 설정

- [ ] `@supabase/supabase-js` 및 `@supabase/ssr` 설치 (`apps/web`)
- [ ] Supabase 클라이언트 유틸리티 생성:
  - [ ] `src/lib/supabase/client.ts` — 브라우저용 클라이언트 (`createBrowserClient`)
  - [ ] `src/lib/supabase/server.ts` — Server Component/Action용 클라이언트 (`createServerClient` with cookies)
  - [ ] `src/lib/supabase/middleware.ts` — 세션 갱신 미들웨어
- [ ] `middleware.ts` (root) — Supabase 세션 갱신 + 보호 라우트 리다이렉트 (`/diagnosis`, `/vault`, `/mypage`는 로그인 필수)
- [ ] 소셜 로그인 구현:
  - [ ] Kakao OAuth 설정 (Supabase Dashboard → Auth → Providers)
  - [ ] Naver OAuth 설정
  - [ ] Google OAuth 설정
- [ ] `/login` 페이지 — 소셜 로그인 버튼 3개 (Kakao/Naver/Google), 로고, 서비스 소개 문구
- [ ] `/auth/callback` 라우트 — OAuth 콜백 처리 (`code` → session exchange)
- [ ] Auth 상태 기반 UI 분기:
  - [ ] 로그인 전: BottomNav에서 진단/금고/마이 탭 클릭 시 `/login`으로 리다이렉트
  - [ ] 로그인 후: 정상 네비게이션
- [ ] 신규 유저 가입 시 `users` 테이블에 자동 row 생성 (Supabase trigger 또는 Auth callback에서 처리)

### 1-2. 레이아웃 (완료)

- [x] `MobileLayout` 구현 — max-w-lg 컨테이너, BottomNav, Toaster
- [x] `BottomNav` 컴포넌트 — 5탭(홈/진단/커뮤니티/금고/마이), active 상태, safe-area-inset
- [x] Pretendard 폰트 CDN 로드
- [x] 디자인 토큰 CSS 변수 (Deep Teal primary, safe/warning/danger 시맨틱)
- [x] QueryClientProvider + TanStack Query 설정

---

## Phase 2: Core Feature — Estimate Diagnosis (킬러 피처)

> **상태:** Zustand 스토어, UI 컴포넌트(FileUpload, MultiStepForm, BagajiScore) 준비 완료. 페이지 및 실제 로직 미구현.

### 2-0. 진단 플로우 라우트 구조

- [ ] `/diagnosis` 라우트 그룹 생성:
  - [ ] `/diagnosis` — 진단 시작 랜딩 (CTA 버튼)
  - [ ] `/diagnosis/flow` — 멀티스텝 위저드 (upload → masking → info → verify → result)
  - [ ] `/diagnosis/result/[id]` — 진단 결과 상세 페이지

### 2-1. Step 1 — 견적서 업로드 (Upload)

- [ ] 업로드 UI 구현 (`/diagnosis/flow` 내 step 0):
  - [ ] `FileUpload` 컴포넌트 연동 (이미 `@ggaba/ui`에 있음)
  - [ ] 다중 이미지 업로드 지원 (최대 5장)
  - [ ] 업로드된 이미지 썸네일 목록 + 삭제 기능
- [ ] Supabase Storage 업로드 Server Action:
  - [ ] `src/app/diagnosis/_actions/upload.ts` — 이미지를 `estimate-files` 버킷에 업로드
  - [ ] 업로드 후 public URL 반환
- [ ] `useDiagnosisStore.setImages()` 호출로 상태 저장

### 2-2. Step 2 — 개인정보 마스킹 (Masking)

- [ ] 마스킹 UI 구현 (`/diagnosis/flow` 내 step 1):
  - [ ] Canvas 기반 이미지 위에 "문지르기" 블러 도구
  - [ ] 터치/마우스 드래그로 민감 정보 영역 블러 처리
  - [ ] "자동 마스킹" 토글 (전화번호, 주소 패턴 자동 감지 — Phase 1에서는 UI만, 로직은 Mock)
- [ ] 마스킹 옵션 저장: `useDiagnosisStore.setMasking()`
- [ ] 마스킹 완료된 이미지를 Supabase Storage에 별도 저장 (원본 유지)

### 2-3. Step 3 — 추가 정보 입력 (Info)

- [ ] 정보 입력 폼 구현 (`/diagnosis/flow` 내 step 2):
  - [ ] React Hook Form + Zod 연동
  - [ ] 필드: 지역(region) — 시/군/구 Select, 건물 유형(buildingType) — 아파트/빌라/오피스텔/단독주택 Select, 아파트명 입력(optional), 평수(sizePyeong) — 숫자 입력
  - [ ] 제목(title) — 자동 생성 ("마포구 24평 아파트 견적")
- [ ] 유저 기본 정보가 있으면 자동 채움 (Skip 가능)
- [ ] `useDiagnosisStore.setUserInput()` 호출로 상태 저장
- [ ] Zod 스키마 검증 (`packages/lib/schemas`에 `diagnosisInfoSchema` 추가)

### 2-4. Step 4 — 항목 검증 (Verify) — Human-in-the-loop

- [ ] Mock OCR 함수 구현:
  - [ ] `src/lib/mock-ocr.ts` — 이미지 URL을 받아 4-tier 견적 항목 JSON 반환 (하드코딩된 샘플 데이터)
  - [ ] 반환 형식: `ExtractedLineItem[]` (id, category, detail, unit, unitPrice, quantity, totalPrice)
- [ ] 항목 검증 UI 구현 (`/diagnosis/flow` 내 step 3):
  - [ ] `Table` 컴포넌트로 추출 항목 표시 (Category | Detail | Unit | Qty | UnitPrice | Total)
  - [ ] 행 인라인 편집 기능 (클릭 → Input으로 변환)
  - [ ] 행 추가/삭제 버튼
  - [ ] 카테고리별 소계 표시
  - [ ] 전체 합계 표시
- [ ] `useDiagnosisStore.updateLineItem()`, `removeLineItem()`, `addLineItem()` 연동
- [ ] "다음" 클릭 시 데이터 최종 확인 모달

### 2-5. Step 5 — 진단 결과 (Result)

- [ ] 진단 제출 Server Action:
  - [ ] `src/app/diagnosis/_actions/submit.ts` — estimates + estimate_items 테이블에 INSERT
  - [ ] Mock 분석 로직: 각 항목의 unitPrice를 시세 범위와 비교하여 priceRating 산출
  - [ ] 전체 badPriceScore 계산 (항목별 과다/적정/저가 비율 기반)
- [ ] 결과 페이지 UI (`/diagnosis/result/[id]`):
  - [ ] `BagajiScore` 게이지 (이미 `@ggaba/ui`에 있음) — 전체 바가지 점수
  - [ ] 분석 요약 카드: "인건비가 평균보다 32% 높습니다", "철거 비용이 누락되었습니다" 등
  - [ ] 항목별 분석 테이블 (priceRating: 적정/주의/과다 컬러링, 시세 범위 표시)
  - [ ] 액션 버튼: "커뮤니티에 공유" / "견적서 저장" / "다시 진단하기"
- [ ] TanStack Query 훅:
  - [ ] `useEstimateDetail(id)` — 견적 상세 + items 조회
  - [ ] `useSubmitDiagnosis()` — mutation: 진단 제출
- [ ] `useDiagnosisStore.reset()` 호출로 상태 초기화 (결과 확인 후)

### 2-6. 진단 플로우 통합

- [ ] `/diagnosis/flow/page.tsx` — MultiStepForm + StepNavigation 연동
  - [ ] `useDiagnosisStore.currentStep`에 따라 Step 1~5 컴포넌트 조건부 렌더링
  - [ ] StepNavigation에서 nextStep/prevStep 호출
  - [ ] 각 Step의 유효성 검증 후 다음 단계 진행 허용
- [ ] 스텝 간 데이터 흐름 테스트 (Upload → Masking → Info → Verify → Result)

---

## Phase 3: Community & Feed

> **상태:** DB 스키마 완료, 쿼리 키 팩토리 준비. 페이지 미구현.

### 3-1. 커뮤니티 피드 목록

- [ ] `/community` 페이지:
  - [ ] 탭 필터: 전체 / 견적공유(share) / 시공후기(review) / 질문(qna)
  - [ ] 피드 카드 컴포넌트 (`CommunityCard`):
    - [ ] 작성자 정보 (닉네임, 프로필)
    - [ ] 게시글 제목, 내용 미리보기 (2줄)
    - [ ] 견적 요약 (연결된 경우): 지역, 평수, 바가지 점수 뱃지
    - [ ] 조회수, 좋아요, 댓글 수
  - [ ] 무한 스크롤 (TanStack Query `useInfiniteQuery` + Intersection Observer)
- [ ] Server Action: `src/app/community/_actions/posts.ts`
  - [ ] `getPosts(type?, cursor?)` — 커서 기반 페이지네이션
- [ ] TanStack Query 훅: `useCommunityPosts(type?)`

### 3-2. 커뮤니티 상세 페이지

- [ ] `/community/[id]` 페이지:
  - [ ] 게시글 본문
  - [ ] 연결된 견적 테이블 (읽기 전용, 마스킹 적용됨)
  - [ ] 투표 버튼: "싸다 👍" / "적당하다 🤝" / "비싸다 👎"
  - [ ] 댓글 목록 (대댓글 지원, 최신순)
  - [ ] 댓글 작성 폼 (로그인 필수)
- [ ] Server Actions:
  - [ ] `getPost(id)` — 게시글 상세 + 견적 데이터 + 댓글
  - [ ] `addComment(postId, content, parentId?)` — 댓글/대댓글 작성
  - [ ] `votePost(postId, type)` — 투표 (추후 별도 votes 테이블 필요 시 추가)

### 3-3. 게시글 작성

- [ ] `/community/write` 페이지:
  - [ ] 게시글 유형 선택 (견적공유 / 시공후기 / 질문)
  - [ ] 제목, 본문 입력 (React Hook Form)
  - [ ] "금고에서 견적 첨부" — 저장된 진단 결과 목록에서 선택
  - [ ] 이미지 업로드 (최대 5장)
  - [ ] 프라이버시 마스킹 옵션 (가격 마스킹, 이미지 마스킹)
- [ ] Server Action: `createPost(data)` — community_posts INSERT + 이미지 업로드

---

## Phase 4: Home & My Page

> **상태:** 홈 데모 페이지 있음. 실제 데이터 연동 및 마이페이지 미구현.

### 4-1. 홈 페이지 고도화

- [ ] 히어로 섹션 개선:
  - [ ] "3초만에 바가지 확인하세요" CTA → `/diagnosis`로 이동
  - [ ] 로그인 상태에 따라 CTA 문구 변경
- [ ] 실시간 티커 위젯:
  - [ ] "마포구 24평 방금 분석 완료" 형식
  - [ ] 최근 진단 결과 10건을 1초 간격 슬라이드 (Server Component에서 데이터 fetch)
- [ ] 인기 커뮤니티 게시글 3건 카드
- [ ] 서비스 통계: 총 진단 수, 평균 바가지 점수, 누적 절약 금액

### 4-2. 금고 (Vault) 페이지

- [ ] `/vault` 페이지:
  - [ ] 내 저장 견적 목록 (카드 형태)
  - [ ] 카드 정보: 제목, 지역, 평수, 바가지 점수, 진단 날짜, 상태 뱃지
  - [ ] 카드 클릭 → `/diagnosis/result/[id]`로 이동
  - [ ] 빈 상태 UI: "아직 진단한 견적이 없어요" + CTA
- [ ] Server Action: `getMyEstimates()` — 현재 유저의 estimates 목록 조회

### 4-3. 마이 페이지

- [ ] `/mypage` 페이지:
  - [ ] 프로필 섹션: 닉네임, 이메일, 프로필 이미지, 티어 뱃지
  - [ ] 프로필 수정 기능 (닉네임, 프로필 이미지)
  - [ ] 내 활동:
    - [ ] 내 게시글 목록
    - [ ] 내 댓글 목록
  - [ ] 포인트 현황 (현재 포인트, 사용 내역 — Phase 1에서는 표시만)
  - [ ] 설정:
    - [ ] 기본 정보 설정 (지역, 건물유형, 평수 — 진단 시 자동 채움용)
    - [ ] 로그아웃 버튼
- [ ] Server Actions:
  - [ ] `getProfile()` — 현재 유저 정보
  - [ ] `updateProfile(data)` — 닉네임, 프로필 이미지 수정
  - [ ] `getMyPosts()` — 내 게시글 목록
  - [ ] `getMyComments()` — 내 댓글 목록

---

## Phase 5: Polish & Refinement

> **상태:** 미착수. Phase 2~4 완료 후 진행.

### 5-1. 규칙 기반 자동 알림 (Rule-based Alerts)

- [ ] 견적 분석 시 자동 경고 규칙 엔진:
  - [ ] "철거 비용이 누락되었습니다" — 카테고리에 '철거'가 없으면 경고
  - [ ] "방수 공사가 누락되었습니다" — 욕실 카테고리에 '방수'가 없으면 경고
  - [ ] "인건비 비율이 평균(35%)보다 높습니다" — 인건비 카테고리 합계 / 전체 합계 비교
  - [ ] "단가가 시세의 2배 이상입니다" — 개별 항목 unitPrice vs 시세 범위 비교
- [ ] 경고 결과를 진단 결과 페이지에 알림 카드로 표시

### 5-2. UX 개선

- [ ] 모든 데이터 로딩 상태에 `Skeleton` 적용:
  - [ ] 홈 피드
  - [ ] 커뮤니티 목록/상세
  - [ ] 금고 목록
  - [ ] 진단 결과
- [ ] 모든 사용자 액션에 `Toast` 피드백 적용:
  - [ ] 견적 업로드 성공/실패
  - [ ] 진단 완료
  - [ ] 게시글 작성 완료
  - [ ] 댓글 작성 완료
  - [ ] 프로필 수정 완료
- [ ] 에러 바운더리:
  - [ ] `src/app/error.tsx` — 전역 에러 페이지
  - [ ] `src/app/not-found.tsx` — 404 페이지
- [ ] 빈 상태(Empty State) UI:
  - [ ] 커뮤니티 게시글 없음
  - [ ] 금고 견적 없음
  - [ ] 검색 결과 없음

### 5-3. 성능 최적화

- [ ] 이미지 최적화: `next/image`로 견적서 이미지 렌더링
- [ ] 코드 스플리팅: 진단 플로우 컴포넌트 `dynamic import`
- [ ] Bundle 분석: `@next/bundle-analyzer`로 번들 사이즈 확인
- [ ] Lighthouse 점수 80+ 달성 (Mobile)

### 5-4. 배포

- [ ] Vercel 프로젝트 연결 (Turborepo 설정)
- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] Preview 배포 확인
- [ ] Production 배포

---

## 참고: 기 구현 완료 항목 요약

| 영역 | 완료 항목 |
|------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces, 5 패키지 구조 |
| **DB** | Drizzle 스키마 6 테이블, relations, 클라이언트 (마이그레이션 미실행) |
| **UI** | 13개 컴포넌트 (Button, Card, Input, Progress, Skeleton, Toast, BottomNav, FileUpload, MultiStepForm, BagajiScore, Table) |
| **Lib** | cn(), formatDate/Currency, Zod 스키마 |
| **Config** | ESLint, TypeScript(base/nextjs/library), Tailwind(Deep Teal 테마) |
| **Web Layout** | MobileLayout, BottomNav, Toaster, Pretendard, 디자인 토큰 |
| **State** | useDiagnosisStore (Zustand + persist), QueryProvider, Query Keys Factory, API Client |
| **Home** | 데모 랜딩 페이지 (히어로, BagajiScore 예시, 기능 카드, Skeleton 미리보기) |
