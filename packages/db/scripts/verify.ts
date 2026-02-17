import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("📋 Public 테이블 목록:");
  tables.forEach((t) => console.log("  ✅", t.table_name));

  const enums = await sql`
    SELECT typname FROM pg_type
    WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e' ORDER BY typname
  `;
  console.log("\n📋 Enum 목록:");
  enums.forEach((e) => console.log("  ✅", e.typname));

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
