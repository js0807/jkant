import type { Metadata } from "next";
import { Gowun_Batang, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

export const metadata: Metadata = {
  title: "아무도 모르는 밤의 요정",
  description: "이미지를 올리면 요정이 영상으로 바꿔주는 데모",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${gowunBatang.variable} ${nanumMyeongjo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
