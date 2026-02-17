import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 신규 유저인 경우 users 테이블에 row 생성
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // upsert: 이미 존재하면 무시
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingUser) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            nickname:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              user.email?.split("@")[0] ??
              "사용자",
            profile_image_url:
              user.user_metadata?.avatar_url ?? null,
          });
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
