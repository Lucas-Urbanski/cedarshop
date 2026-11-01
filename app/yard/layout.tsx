import type { Metadata } from "next";

import { YardProvider } from "@/components/yard/YardProvider";
import YardShell from "@/components/yard/YardShell";
import type { ChildrenProps } from "@/types/types";

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

export default function YardLayout({ children }: ChildrenProps) {
  return (
    <YardProvider>
      <YardShell>{children}</YardShell>
    </YardProvider>
  );
}