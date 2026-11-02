import type { Metadata } from "next";

import YardAccess from "@/components/yard/YardAccess";
import type { ChildrenProps } from "@/types/types";

import "@/styles/yard.css";

export const metadata: Metadata = {
  title: "Yard Operations | The Cedar Shop",
  appleWebApp: {
    capable: true,
    title: "Cedar Yard",
    statusBarStyle: "default",
  },
};

export default function YardLayout({ children }: ChildrenProps) {
  return <YardAccess>{children}</YardAccess>;
}