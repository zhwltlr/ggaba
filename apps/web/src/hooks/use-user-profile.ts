"use client";

import { useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStore } from "@/stores/use-user-store";
import { getProfile } from "@/app/mypage/_actions/profile";

/**
 * DB users 테이블에서 user_mode, business_profile_id를 조회하여
 * useUserStore에 동기화하는 훅.
 * MobileLayout 등 앱 최상위에서 한 번 호출.
 */
export function useUserProfile() {
  const { user, loading } = useAuth();
  const hydrate = useUserStore((s) => s.hydrate);
  const isHydrated = useUserStore((s) => s.isHydrated);

  useEffect(() => {
    if (loading || !user || isHydrated) return;

    getProfile().then(({ profile }) => {
      if (profile) {
        hydrate({
          userMode: profile.user_mode ?? "consumer",
          businessProfileId: profile.business_profile_id ?? null,
        });
      }
    });
  }, [user, loading, isHydrated, hydrate]);
}
