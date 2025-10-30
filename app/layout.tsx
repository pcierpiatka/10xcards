import type { Metadata } from "next";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { Toaster } from "@/components/ui/sonner";
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
      <body className="m-0 w-full h-full">
        <GlobalHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
