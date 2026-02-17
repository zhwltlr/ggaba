import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * DB 연결 설정
 *
 * Next.js 환경에서의 주의사항:
 * - Server Components / Server Actions에서만 사용 (클라이언트 번들에 포함 X)
 * - dev 모드에서 HMR로 인한 다중 연결 방지를 위해 globalThis에 캐싱
 * - Supabase의 connection string을 DATABASE_URL 환경변수로 설정
 *
 * 사용법:
 *   import { db } from "@ggaba/db/client";
 *   const users = await db.query.users.findMany();
 */

const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

function getConnection() {
  if (globalForDb.connection) {
    return globalForDb.connection;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL 환경변수가 설정되지 않았습니다. " +
        "Supabase 프로젝트의 Connection String을 .env.local에 설정해주세요."
    );
  }

  const connection = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.connection = connection;
  }

  return connection;
}

export const db = drizzle(getConnection(), { schema });

export type Database = typeof db;
