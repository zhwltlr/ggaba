import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Feature Flag: AI 진단 기능 비활성화 시 접근 차단
  const aiDiagnosisEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS === "true";
  const hiddenPaths = ["/diagnosis", "/vault"];
  const isHiddenRoute = hiddenPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!aiDiagnosisEnabled && isHiddenRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 보호 라우트: 로그인 필수
  const protectedPaths = [
    "/diagnosis",
    "/vault",
    "/mypage",
    "/auction/new",
    "/bids",
    "/portfolio/edit",
    "/onboarding",
  ];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 로그인 상태에서 /login 접근 시 홈으로
  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
