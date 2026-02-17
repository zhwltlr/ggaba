import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileLayout } from "@/components/layout/mobile-layout";

export const metadata: Metadata = {
  title: "GGABA - 인테리어 견적 플랫폼",
  description: "AI 기반 인테리어 견적 분석 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <Providers>
          <MobileLayout>{children}</MobileLayout>
        </Providers>
      </body>
    </html>
  );
}
