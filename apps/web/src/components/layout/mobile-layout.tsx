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
  ClipboardCheck,
  MessageSquare,
  Lock,
  User,
} from "lucide-react";

const HIDE_NAV_PATHS = ["/login", "/auth"];

const AI_DIAGNOSIS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS === "true";

const ALL_TABS: (BottomNavItem & { hidden?: boolean })[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "진단", href: "/diagnosis", icon: ClipboardCheck, hidden: !AI_DIAGNOSIS_ENABLED },
  { label: "커뮤니티", href: "/community", icon: MessageSquare },
  { label: "금고", href: "/vault", icon: Lock, hidden: !AI_DIAGNOSIS_ENABLED },
  { label: "마이", href: "/mypage", icon: User },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const hideNav = HIDE_NAV_PATHS.some((path) => pathname.startsWith(path));

  const navItems = useMemo(
    () => ALL_TABS.filter((tab) => !tab.hidden),
    [],
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
