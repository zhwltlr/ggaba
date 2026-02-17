"use client";

import { usePathname, useRouter } from "next/navigation";
import { BottomNav, Toaster } from "@ggaba/ui";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <main className="pb-bottom-nav">{children}</main>
      <BottomNav currentPath={pathname} onNavigate={(href) => router.push(href)} />
      <Toaster />
    </div>
  );
}
