"use client";

import * as React from "react";
import {
  Home,
  ClipboardCheck,
  MessageSquare,
  Lock,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@ggaba/lib/utils";

export interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const defaultItems: BottomNavItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "진단", href: "/diagnosis", icon: ClipboardCheck },
  { label: "커뮤니티", href: "/community", icon: MessageSquare },
  { label: "금고", href: "/vault", icon: Lock },
  { label: "마이", href: "/mypage", icon: User },
];

export interface BottomNavProps {
  items?: BottomNavItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function BottomNav({
  items = defaultItems,
  currentPath,
  onNavigate,
}: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
              />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
