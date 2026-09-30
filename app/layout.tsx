import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIRAL AI | 오늘 뭐 올리지?",
  description: "주제를 입력하면 오늘 만들 콘텐츠 3개를 기획합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

