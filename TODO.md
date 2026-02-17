# GGABA TODO

> 마지막 업데이트: 2026-02-18
> **v2.0 Pivot:** AI 진단 → 비공개 역경매 플랫폼

## v1.0 완료 (보존 — Feature Flag로 숨김)

- [x] Phase 0: Database & Schema Design — 6 테이블 + 4 enum + 2 Storage 버킷
- [x] Phase 1: Authentication & Layout — Supabase Auth, 소셜 로그인, 보호 라우트
- [x] Phase 2: 견적 진단 — 5-step 위저드, Mock OCR, 가격 분석
- [x] Phase 3: 커뮤니티 & 피드 — 피드, 상세, 댓글/대댓글, 작성
- [x] Phase 4: 홈 & 마이페이지 — 홈 고도화, 금고, 마이페이지
- [x] Phase 5: 마무리 — 규칙 기반 알림, 에러 바운더리, 코드 스플리팅

## v2.0 진행

- [x] Phase 0: Refactoring & Migration — AI 기능 숨김, DB 스키마 확장 (7 테이블 + 5 enum 추가)
- [ ] Phase 1: Architecture & Dual Mode — 소비자/시공사 모드 전환, 동적 탭바
- [ ] Phase 2: Consumer Auction Flow — 경매 요청, 상태, 입찰 비교
- [ ] Phase 3: Contractor Bidding Flow — 경매 탐색, 단가 입찰, Blind 로직
- [ ] Phase 4: Match & Communication — 시공사 선택, 실시간 채팅
- [ ] Phase 5: Community & Portfolio — 포트폴리오, 리뷰, 커뮤니티 확장
- [ ] Phase 6: Admin & Safety — 페널티, 신고 시스템

## 수동 설정 필요

- [ ] Kakao OAuth (Supabase Dashboard → Auth → Providers)
- [ ] Google OAuth (Supabase Dashboard → Auth → Providers)
- [ ] Vercel 환경 변수 설정 (Dashboard)
- [ ] Production 배포
