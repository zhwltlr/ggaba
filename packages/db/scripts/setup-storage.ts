/**
 * Supabase Storage 버킷 생성 스크립트
 *
 * 실행: pnpm --filter @ggaba/db setup:storage
 *
 * 필요 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ 환경변수가 설정되지 않았습니다:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  console.error("\n📋 apps/web/.env.local 파일을 먼저 설정해주세요.");
  process.exit(1);
}

const buckets = [
  {
    id: "estimate-files",
    name: "estimate-files",
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ],
  },
  {
    id: "profile-images",
    name: "profile-images",
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
];

async function createBucket(bucket: (typeof buckets)[number]) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bucket),
  });

  if (response.ok) {
    console.log(`✅ 버킷 생성 완료: ${bucket.id}`);
  } else {
    const data = await response.json();
    if (data.message?.includes("already exists")) {
      console.log(`⏭️  버킷 이미 존재: ${bucket.id}`);
    } else {
      console.error(`❌ 버킷 생성 실패: ${bucket.id}`, data);
    }
  }
}

async function main() {
  console.log("🪣 Supabase Storage 버킷 생성 시작...\n");

  for (const bucket of buckets) {
    await createBucket(bucket);
  }

  console.log("\n✨ Storage 설정 완료!");
}

main().catch(console.error);
