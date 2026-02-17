"use client";

import { usePathname, useRouter } from "next/navigation";
import { BottomNav, Toaster } from "@ggaba/ui";

const HIDE_NAV_PATHS = ["/login", "/auth"];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const hideNav = HIDE_NAV_PATHS.some((path) => pathname.startsWith(path));

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <main className={hideNav ? "" : "pb-bottom-nav"}>{children}</main>
      {!hideNav && (
        <BottomNav
          currentPath={pathname}
          onNavigate={(href) => router.push(href)}
        />
      )}
      <Toaster />
    </div>
  );
}
