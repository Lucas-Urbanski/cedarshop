import type { Metadata } from "next";

import { YardProvider } from "@/components/yard/YardProvider";
import YardShell from "@/components/yard/YardShell";

import "@/styles/yard.css";

export const metadata: Metadata = {
  title: "Yard Operations | The Cedar Shop",
  manifest: "/yard/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cedar Yard",
    statusBarStyle: "default",
  },
};

export default function YardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YardProvider>
      <YardShell>{children}</YardShell>
    </YardProvider>
  );
}