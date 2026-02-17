#!/bin/bash
# ============================================
# GGABA Supabase 초기 설정 스크립트
# ============================================
# 사용법:
#   1. apps/web/.env.local 설정
#   2. packages/db/.env.local 설정 (DATABASE_URL)
#   3. pnpm --filter @ggaba/db setup
# ============================================

set -e

echo "🚀 GGABA Supabase 설정을 시작합니다..."
echo ""

# 1. DB 마이그레이션
echo "📦 Step 1: DB 스키마 Push..."
pnpm drizzle-kit push
echo ""

# 2. Storage 버킷 생성
echo "🪣 Step 2: Storage 버킷 생성..."
npx tsx scripts/setup-storage.ts
echo ""

echo "============================================"
echo "✅ 설정 완료!"
echo ""
echo "다음 단계:"
echo "  1. pnpm --filter @ggaba/web dev 로 개발 서버 시작"
echo "  2. Supabase Dashboard에서 Auth Providers 설정 (Kakao/Naver/Google)"
echo "============================================"
