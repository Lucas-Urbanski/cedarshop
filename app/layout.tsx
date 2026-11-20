import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/workspace.css";
import { ThemeProvider } from "@/components/themeProvider";
import type { ChildrenProps } from "@/types/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Cedar Shop",
  description: "Cedar Shop Lumber Management System",
  icons: {
    apple: "/cedarshop-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Cedar Shop",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: ChildrenProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
