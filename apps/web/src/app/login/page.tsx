"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@ggaba/ui";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginButtons() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const supabase = createClient();

  async function handleOAuthLogin(provider: "kakao" | "google" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        size="lg"
        className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 font-semibold"
        onClick={() => handleOAuthLogin("kakao")}
      >
        <KakaoIcon />
        카카오로 시작하기
      </Button>
<Button
        size="lg"
        variant="outline"
        className="w-full font-semibold"
        onClick={() => handleOAuthLogin("google")}
      >
        <GoogleIcon />
        Google로 시작하기
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-bottom-nav">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* 로고 & 서비스 소개 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-bold text-primary">GGABA</h1>
          <p className="text-lg font-medium">인테리어 견적, 바가지 없이</p>
          <p className="text-sm text-muted-foreground">
            견적서를 올리면 AI가 적정 가격을 분석해드립니다
          </p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <Suspense
          fallback={
            <div className="flex flex-col gap-3 w-full">
              <div className="h-11 rounded-md bg-muted animate-pulse" />
              <div className="h-11 rounded-md bg-muted animate-pulse" />
              <div className="h-11 rounded-md bg-muted animate-pulse" />
            </div>
          }
        >
          <LoginButtons />
        </Suspense>

        {/* 약관 안내 */}
        <p className="text-xs text-center text-muted-foreground">
          로그인 시{" "}
          <span className="underline">이용약관</span> 및{" "}
          <span className="underline">개인정보처리방침</span>에 동의합니다
        </p>
      </div>
    </div>
  );
}

// ── 아이콘 컴포넌트 ──

function KakaoIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.8 5.27 4.53 6.68-.2.74-.73 2.68-.76 2.84-.04.21.08.21.16.15.07-.04 2.17-1.47 3.05-2.07.64.09 1.3.14 1.97.14 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
    </svg>
  );
}


function GoogleIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
