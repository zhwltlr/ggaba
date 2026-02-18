"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BottomNav,
  Toaster,
  type BottomNavItem,
} from "@ggaba/ui";
import {
  Home,
  Gavel,
  ClipboardList,
  MessageSquare,
  Image,
  User,
  ShieldCheck,
} from "lucide-react";
import { useUserStore } from "@/stores/use-user-store";
import { useUserProfile } from "@/hooks/use-user-profile";

const HIDE_NAV_PATHS = ["/login", "/auth", "/onboarding"];

const AI_DIAGNOSIS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS === "true";

// ── 소비자 모드 탭 ──
const CONSUMER_TABS: BottomNavItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "경매", href: "/auction", icon: Gavel },
  ...(AI_DIAGNOSIS_ENABLED
    ? [{ label: "진단", href: "/vault", icon: ShieldCheck } as BottomNavItem]
    : []),
  { label: "커뮤니티", href: "/community", icon: MessageSquare },
  { label: "마이", href: "/mypage", icon: User },
];

// ── 시공사 모드 탭 ──
const CONTRACTOR_TABS: BottomNavItem[] = [
  { label: "입찰목록", href: "/bids", icon: ClipboardList },
  { label: "포트폴리오", href: "/portfolio", icon: Image },
  { label: "커뮤니티", href: "/community", icon: MessageSquare },
  { label: "마이", href: "/mypage", icon: User },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const userMode = useUserStore((s) => s.userMode);

  // DB에서 유저 모드 동기화
  useUserProfile();

  const hideNav = HIDE_NAV_PATHS.some((path) => pathname.startsWith(path));

  const navItems = useMemo(
    () => (userMode === "contractor" ? CONTRACTOR_TABS : CONSUMER_TABS),
    [userMode],
  );

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <main className={hideNav ? "" : "pb-bottom-nav"}>{children}</main>
      {!hideNav && (
        <BottomNav
          items={navItems}
          currentPath={pathname}
          onNavigate={(href) => router.push(href)}
        />
      )}
      <Toaster />
    </div>
  );
}
