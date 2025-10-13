import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "10x Cards",
  description: "AI-powered flashcard generator",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 w-full h-full">{children}</body>
    </html>
  );
}
