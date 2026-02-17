/**
 * 마이그레이션 직접 실행 스크립트
 * drizzle-kit push가 인터랙티브 모드로 동작할 때 사용
 *
 * 실행: DATABASE_URL=... npx tsx scripts/migrate.ts
 */
import fs from "fs";
import path from "path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  const migrationsDir = path.join(import.meta.dirname, "../src/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`📦 ${files.length}개 마이그레이션 파일 발견\n`);

  for (const file of files) {
    console.log(`▶️  실행 중: ${file}`);
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    // drizzle-kit의 statement-breakpoint로 구분된 개별 SQL 실행
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
      } catch (err: unknown) {
        const error = err as Error;
        // 이미 존재하는 객체는 무시
        if (
          error.message?.includes("already exists") ||
          error.message?.includes("duplicate_object")
        ) {
          console.log(`   ⏭️  이미 존재 (skip)`);
        } else {
          console.error(`   ❌ 에러: ${error.message}`);
          throw err;
        }
      }
    }
    console.log(`   ✅ 완료`);
  }

  console.log("\n✨ 모든 마이그레이션 실행 완료!");
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
