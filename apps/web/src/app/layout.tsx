import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { MobileLayout } from "@/components/layout/mobile-layout";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

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
    <html lang="ko" className={pretendard.variable}>
      <body className={pretendard.className}>
        <Providers>
          <MobileLayout>{children}</MobileLayout>
        </Providers>
      </body>
    </html>
  );
}
