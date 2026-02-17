# GGABA TODO

> 마지막 업데이트: 2026-02-17

## 완료

- [x] Phase 0: Database & Schema Design — Supabase 6 테이블 + 4 enum + 2 Storage 버킷
- [x] Phase 1: Authentication & Layout — Supabase Auth, 소셜 로그인, 보호 라우트, 유저 자동 생성

## 진행 중

### Phase 2: 견적 진단 (킬러 피처)

- [ ] 2-0. 진단 라우트 구조 (`/diagnosis`, `/diagnosis/flow`, `/diagnosis/result/[id]`)
- [ ] 2-1. Step 1 — 견적서 업로드 (FileUpload + Supabase Storage Server Action)
- [ ] 2-2. Step 2 — 개인정보 마스킹 (Canvas 블러 도구)
- [ ] 2-3. Step 3 — 추가 정보 입력 (지역, 건물유형, 평수 — RHF + Zod)
- [ ] 2-4. Step 4 — 항목 검증 (Mock OCR + 편집 가능한 테이블)
- [ ] 2-5. Step 5 — 진단 결과 (Submit Server Action + BagajiScore + 분석 카드)
- [ ] 2-6. 진단 플로우 통합 (MultiStepForm + StepNavigation)

## 미착수

### Phase 3: 커뮤니티 & 피드

- [ ] 3-1. 커뮤니티 피드 목록 (탭 필터, 무한 스크롤)
- [ ] 3-2. 커뮤니티 상세 (투표, 댓글/대댓글)
- [ ] 3-3. 게시글 작성 (유형 선택, 견적 첨부, 이미지)

### Phase 4: 홈 & 마이페이지

- [ ] 4-1. 홈 페이지 고도화 (실시간 티커, 인기 게시글, 통계)
- [ ] 4-2. 금고(Vault) 페이지 (내 견적 목록)
- [ ] 4-3. 마이 페이지 (프로필, 활동, 포인트, 설정)

### Phase 5: 마무리

- [ ] 5-1. 규칙 기반 자동 알림 (누락 항목, 과다 단가 경고)
- [ ] 5-2. UX 개선 (Skeleton, Toast, 에러 바운더리, 빈 상태)
- [ ] 5-3. 성능 최적화 (이미지, 코드 스플리팅, Lighthouse)
- [ ] 5-4. 배포 (Vercel Production)

## 수동 설정 필요

- [ ] Kakao OAuth (Supabase Dashboard → Auth → Providers)
- [ ] Google OAuth (Supabase Dashboard → Auth → Providers)
- [ ] GitHub OAuth (Supabase Dashboard → Auth → Providers)
