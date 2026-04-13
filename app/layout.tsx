import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "URL 메뉴 트리 추출기",
  description: "웹사이트 내비게이션 구조를 메뉴 트리로 시각화합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
