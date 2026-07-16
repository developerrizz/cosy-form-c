import type { Metadata } from "next";
import { Noto_Sans_KR, DM_Sans } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GLOWUPRIZZ 아티스트 계약 시작하기",
  description:
    "아티스트 계약 시작하기 — 채널·수익 범위에 맞는 계약 유형 안내 및 계약서 확인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${dmSans.variable} ${notoSansKr.className}`}>
        {children}
      </body>
    </html>
  );
}
