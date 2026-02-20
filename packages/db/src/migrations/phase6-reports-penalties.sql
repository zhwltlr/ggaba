-- Phase 6: Reports & Penalties 마이그레이션
-- 신고/페널티 시스템 테이블 및 인덱스 생성

-- Enum 생성
DO $$ BEGIN
  CREATE TYPE report_target_type AS ENUM ('post', 'comment', 'bid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('fake_bid', 'inappropriate', 'spam', 'false_info', 'harassment', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE penalty_type AS ENUM ('warning', 'suspension');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Reports 테이블
CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type" report_target_type NOT NULL,
  "target_id" uuid NOT NULL,
  "target_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reason" report_reason NOT NULL,
  "description" text,
  "status" report_status NOT NULL DEFAULT 'pending',
  "admin_note" text,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Penalties 테이블
CREATE TABLE IF NOT EXISTS "penalties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" penalty_type NOT NULL,
  "reason" text NOT NULL,
  "report_id" uuid REFERENCES "reports"("id") ON DELETE SET NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp with time zone,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "idx_reports_target_user_id" ON "reports"("target_user_id");
CREATE INDEX IF NOT EXISTS "idx_reports_reporter_id" ON "reports"("reporter_id");
CREATE INDEX IF NOT EXISTS "idx_reports_created_at" ON "reports"("created_at");
CREATE INDEX IF NOT EXISTS "idx_penalties_user_id_active" ON "penalties"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_penalties_created_at" ON "penalties"("created_at");
