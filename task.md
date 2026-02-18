# GGABA v2.0 — Blind Reverse Auction Platform (비공개 역경매)

> **Pivot:** AI 견적 진단 플랫폼 → **비공개 역경매 플랫폼**
> **Core Concept:** 소비자가 시공 요청을 올리면, 시공사가 서로의 가격을 모른 채 입찰 (Blind Bidding)
> **Dual Mode:** 하나의 앱에서 소비자 모드 / 시공사 모드 전환
> **Tech:** Next.js 14 App Router / TypeScript / Supabase / Drizzle ORM / Zustand / TanStack Query v5 / shadcn/ui
> **Updated:** 2026-02-19

---

## Phase 0: Refactoring & Migration (기존 코드 보존 & 숨김)

> **목표:** 기존 AI 진단 기능을 삭제하지 않고 숨기고, v2.0에 필요한 DB 스키마를 확장한다.

### 0-1. AI 진단 기능 숨김 처리

- [x] 환경 변수 Feature Flag 추가: `NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS=false`
- [x] 기존 `/diagnosis` 라우트를 `(hidden)/diagnosis` 라우트 그룹으로 이동
- [x] BottomNav에서 "진단" 탭 조건부 렌더링 (Feature Flag 기반)
- [x] 홈 페이지 CTA에서 진단 관련 UI 조건부 숨김
- [x] `/vault` 페이지 Feature Flag 적용 (진단 결과 금고)

### 0-2. DB 스키마 확장 (Drizzle)

- [x] `users` 테이블 확장:
  - [x] `role` 컬럼 추가 — `'consumer' | 'contractor'` (기본값: `'consumer'`)
  - [x] `business_profile_id` 컬럼 추가 — `business_profiles` FK (nullable)
- [x] `business_profiles` 테이블 생성:
  - [x] 사업자 정보: 상호명, 사업자번호, 대표자명, 연락처
  - [x] 인증 상태: `verified` boolean
  - [x] 전문 분야, 시공 가능 지역
- [x] `auctions` 테이블 생성:
  - [x] `user_id` FK (소비자)
  - [x] 요청 정보: region, size_pyeong, budget_min, budget_max, schedule, description
  - [x] 상태: `status` — `'open' | 'bidding' | 'selected' | 'in_progress' | 'completed' | 'cancelled'`
  - [x] 마감 시간: `deadline_at`
  - [x] 주소/연락처: 시공사에게 초기 비공개 (선택 후 공개)
- [x] `bids` 테이블 생성:
  - [x] `auction_id` FK, `contractor_id` FK
  - [x] `total_price`, `message` (시공사 코멘트)
  - [x] `status` — `'submitted' | 'selected' | 'rejected'`
  - [x] Unique constraint: (auction_id, contractor_id) — 중복 입찰 방지
- [x] `bid_items` 테이블 생성 — **기존 estimate_items와 동일한 4-tier 계층 구조**:
  - [x] `bid_id` FK
  - [x] `category` (대분류) → `detail` (세부항목) → `unit` (단위) → `unit_price` (단가)
  - [x] `quantity`, `total_price`, `sort_order`
  - [x] AI 진단 기능 재활용 시 데이터 호환성 보장
- [x] `portfolios` 테이블 생성:
  - [x] `contractor_id` FK
  - [x] 시공 사례: title, description, region, size_pyeong, duration_days, total_cost
  - [x] Before/After 이미지 URL 배열
- [x] `reviews` 테이블 확장 (기존 테이블 업데이트):
  - [x] `auction_id` FK 추가
  - [x] `contractor_id` FK
  - [x] rating (1-5), content, images
- [x] `chat_rooms` 테이블 생성:
  - [x] `auction_id` FK
  - [x] `consumer_id` FK, `contractor_id` FK
  - [x] `status` — `'active' | 'closed'`
- [x] `messages` 테이블 생성:
  - [x] `chat_room_id` FK, `sender_id` FK
  - [x] `content`, `type` — `'text' | 'image' | 'file'`
  - [x] `file_url` (nullable)
  - [x] `read_at` (nullable)
- [x] Drizzle relations 정의 (모든 신규 테이블 간 관계)
- [x] 마이그레이션 생성 및 Supabase 반영

---

## Phase 1: Architecture & Dual Mode Setup

> **목표:** 소비자/시공사 듀얼 모드 전환 아키텍처를 구현한다.

### 1-1. Global State — 듀얼 모드 (Zustand)

- [x] `useUserStore` 확장: `userMode` 상태 추가 (`'CONSUMER' | 'CONTRACTOR'`)
- [x] 모드 전환 함수: `toggleMode()` — 소비자 ↔ 시공사
- [x] 시공사 모드 진입 조건: `business_profile_id` 존재 여부 확인
- [x] 모드 상태 persist (localStorage)

### 1-2. Dynamic Layout — 모드별 탭바

- [x] `BottomNav` 리팩터링: `userMode`에 따라 탭 구성 변경
  - [x] **소비자 모드 탭:** 홈 / 경매 / 커뮤니티 / 마이페이지
  - [x] **시공사 모드 탭:** 입찰목록 / 포트폴리오 / 커뮤니티 / 마이페이지
- [x] 모드 전환 토글 UI (마이페이지 또는 상단 헤더)

### 1-3. Auth & Onboarding 업데이트

- [x] 회원가입 후 온보딩 플로우:
  - [x] 소비자: 최소 정보 수집 (닉네임)
  - [x] 시공사: "사업자 인증" 단계 추가 (사업자번호, 상호명, 전문분야)
- [x] 보호 라우트 업데이트:
  - [x] 시공사 전용 라우트 (`/bids`, `/portfolio/edit`) — role 체크
  - [x] 소비자 전용 라우트 (`/auction/new`) — role 체크
- [x] middleware.ts 업데이트: 모드별 접근 제어

---

## Phase 2: Consumer — Blind Auction Flow (소비자 경매 플로우)

> **목표:** 소비자가 시공 요청을 올리고, 들어온 입찰을 비교하는 핵심 플로우를 구현한다.

### 2-1. 소비자 홈

- [x] `/` 홈 페이지 리디자인 (소비자 모드):
  - [x] "시공 요청하기" CTA 버튼
  - [x] 실시간 경매 현황 위젯 (내 경매 입찰 수, 상태)
  - [ ] 인기 시공사 / 최근 리뷰 미리보기 *(Phase 5 연기 — 시공사/리뷰 데이터 없음)*

### 2-2. 경매 요청 폼 (Multi-step Wizard)

- [x] `/auction/new` 멀티스텝 위저드:
  - [x] Step 1 — 지역 선택 (region)
  - [x] Step 2 — 평수 입력 (size_pyeong)
  - [x] Step 3 — 예산 범위 (budget_min ~ budget_max)
  - [x] Step 4 — 시공 일정 (schedule)
  - [x] Step 5 — 상세 설명 + ~~사진 업로드~~ *(별도 작업 — Storage 버킷 설정 필요)*
- [x] **개인정보 보호:** 주소, 연락처는 시공사에게 초기 비공개
- [x] Server Action: `createAuction(data)` — auctions INSERT
- [x] 생성 후 `/auction/[id]` 상태 페이지로 이동

### 2-3. 경매 상태 페이지

- [x] `/auction/[id]` 페이지:
  - [x] 실시간 입찰자 수 표시 (polling 30초 간격)
  - [x] 마감까지 남은 시간 타이머
  - [x] 상태 뱃지: open → bidding → selected → in_progress → completed
  - [x] 입찰 마감 전: "아직 입찰 진행 중" 안내

### 2-4. 입찰 비교 테이블

- [x] `/auction/[id]/compare` 페이지:
  - [x] 수신된 입찰 비교 테이블 렌더링
  - [x] **컬러 코딩 로직:**
    - [x] 초록 (Green): 해당 항목 최저가 구간
    - [x] 회색 (Gray): 중간 구간
    - [x] 빨강 (Red): 해당 항목 최고가 구간
  - [ ] **단가 기반 표시:** `m²당 단가` 또는 `개당 단가` 기준 비교 *(Phase 3 이후 — bid_items 입력 구현 필요)*
  - [ ] 시공사 포트폴리오 미리보기 링크 *(Phase 5 연기)*
  - [x] "이 시공사 선택" 버튼 *(채팅방 자동 생성은 Phase 4 범위)*
- [x] Server Action: `getBidsForAuction(auctionId)` — 입찰 목록 조회
- [x] Server Action: `selectBid(bidId)` — 입찰 선택 처리

### 2-5. 내 경매 목록

- [x] `/auction` 페이지:
  - [x] 내 경매 요청 목록 (상태별 필터)
  - [x] 카드: 지역, 평수, 예산, 입찰 수, 상태 뱃지
  - [x] 카드 클릭 → `/auction/[id]`

---

## Phase 3: Contractor — Bidding Flow (시공사 입찰 플로우)

> **목표:** 시공사가 공개된 경매를 탐색하고, 단가 기반으로 입찰하는 플로우를 구현한다.

### 3-1. 입찰 가능 경매 목록 (Browser)

- [ ] `/bids` 페이지 (시공사 모드):
  - [ ] 열린 경매 목록 (status: 'open' | 'bidding')
  - [ ] 필터: 지역 / 평수 범위 / 예산 범위
  - [ ] 카드: 지역, 평수, 예산 범위, 마감까지 남은 시간
  - [ ] 이미 입찰한 경매 표시 ("입찰 완료" 뱃지)
- [ ] Server Action: `getOpenAuctions(filters?)` — 경매 목록 조회

### 3-2. 입찰 제출 폼

- [ ] `/bids/[auctionId]/submit` 페이지:
  - [ ] 경매 요청 상세 정보 표시
  - [ ] **단가(m²) 입력 강제:** 각 카테고리별 unit price 입력
    - [ ] 4-tier 계층: category → detail → unit → unit_price
    - [ ] 자동 합계 계산
  - [ ] 시공사 코멘트 입력
  - [ ] 포트폴리오 자동 첨부
  - [ ] **Blind 로직:** 다른 시공사의 입찰 정보 조회 불가 (Server-side 검증)
- [ ] Server Action: `submitBid(data)` — bids + bid_items INSERT
- [ ] 중복 입찰 방지 (DB unique constraint)

### 3-3. 내 입찰 내역

- [ ] `/bids/my` 페이지:
  - [ ] 내가 제출한 입찰 목록
  - [ ] 상태별 필터: submitted / selected / rejected
  - [ ] 선택된 입찰 → 채팅방 이동 링크

---

## Phase 4: Match & Communication (매칭 & 소통)

> **목표:** 소비자가 시공사를 선택하면 채팅방이 생성되고, 실시간 소통이 가능하다.

### 4-1. 시공사 선택 & 채팅방 생성

- [ ] 소비자가 입찰 선택 시:
  - [ ] 해당 bid status → `'selected'`, 나머지 → `'rejected'`
  - [ ] auction status → `'selected'`
  - [ ] `chat_rooms` 자동 생성 (consumer_id + contractor_id + auction_id)
  - [ ] 소비자 주소/연락처 시공사에게 공개 처리

### 4-2. 1:1 실시간 채팅

- [ ] `/chat/[roomId]` 페이지:
  - [ ] 메시지 목록 (실시간 — Supabase Realtime subscribe)
  - [ ] 텍스트 메시지 전송
  - [ ] 이미지/파일 공유 (Supabase Storage 업로드)
  - [ ] 읽음 표시 (`read_at` 업데이트)
- [ ] `/chat` 채팅 목록 페이지:
  - [ ] 내 채팅방 목록
  - [ ] 마지막 메시지 미리보기, 안 읽은 메시지 수
- [ ] Server Actions: `sendMessage()`, `getMessages()`, `markAsRead()`

### 4-3. 계약 & 에스크로 (UI Only)

- [ ] 채팅 내 "표준 계약서 작성" 버튼 (UI 껍데기)
- [ ] "에스크로 결제" 상태 트래킹 UI:
  - [ ] 계약 체결 → 착수금 입금 → 시공 중 → 시공 완료 → 잔금 정산
  - [ ] 상태별 Progress 표시 (실제 결제 연동은 추후)

---

## Phase 5: Community & Portfolio (커뮤니티 & 포트폴리오)

> **목표:** 시공사 포트폴리오, 리뷰 시스템을 구축하고, 기존 커뮤니티를 확장한다.

### 5-1. 시공사 포트폴리오

- [ ] `/portfolio` 페이지 (시공사 본인):
  - [ ] 포트폴리오 목록 + 작성/편집
  - [ ] Before/After 사진 업로드
  - [ ] 시공 정보: 지역, 평수, 기간, 비용
- [ ] `/contractor/[id]` 페이지 (소비자 열람용):
  - [ ] 시공사 프로필 + 포트폴리오 갤러리
  - [ ] 평점, 리뷰 목록
  - [ ] 완료 시공 수, 평균 입찰가

### 5-2. 리뷰 시스템

- [ ] 시공 완료 후 소비자가 리뷰 작성:
  - [ ] 별점 (1-5), 텍스트 리뷰, 사진 첨부
  - [ ] 해당 경매/시공사에 연결
- [ ] 시공사 프로필에 리뷰 평균 반영

### 5-3. 커뮤니티 확장

- [ ] 기존 커뮤니티 코드 재활용
- [ ] 시공사 뱃지 표시: 게시글/댓글에 "시공사" 뱃지
- [ ] 시공사 전용 게시판 카테고리 추가 (시공 팁, 자재 정보 등)

---

## Phase 6: Admin & Safety (관리 & 안전장치)

> **목표:** 플랫폼 신뢰도를 위한 페널티 및 신고 시스템을 구축한다.

### 6-1. 페널티 시스템

- [ ] 최종 시공 금액 > 입찰 금액 × 1.15 시 자동 플래그:
  - [ ] 시공사에게 경고 알림
  - [ ] 반복 시 계정 제재 로직
- [ ] 페널티 이력 관리 테이블 (향후)

### 6-2. 신고 시스템

- [ ] 허위 입찰 신고
- [ ] 부적절 게시글/댓글 신고
- [ ] 신고 접수 UI + Server Action

---

## 참고: v1.0 보존 항목 (Hidden)

> 아래 기능은 삭제되지 않고 Feature Flag로 숨김 처리. 향후 재활용 가능.

| 영역 | 보존 항목 |
|------|-----------|
| **진단 플로우** | 5-step 위저드, Mock OCR, 가격 분석, 규칙 기반 알림 |
| **estimate_items** | 4-tier 계층 구조 (bid_items와 동일 구조로 데이터 호환) |
| **금고** | 내 견적 목록, 진단 결과 상세 |
| **알림 엔진** | alert-rules.ts — 누락/과다/저가 분석 규칙 |

---

## 참고: 기 구현 완료 항목 (v1.0에서 이어짐)

| 영역 | 상태 | 비고 |
|------|------|------|
| Monorepo | ✅ 유지 | Turborepo + pnpm workspaces |
| DB (6 테이블) | ✅ 유지 + 확장 예정 | users 확장, 신규 테이블 7개 추가 |
| UI 컴포넌트 | ✅ 유지 | shadcn/ui 기반 13개 컴포넌트 재활용 |
| Auth | ✅ 유지 | Supabase Auth (Kakao/Google) |
| 커뮤니티 | ✅ 유지 + 확장 | 시공사 뱃지 추가 예정 |
| 홈/마이페이지 | 🔄 리디자인 | 듀얼 모드 대응 |
