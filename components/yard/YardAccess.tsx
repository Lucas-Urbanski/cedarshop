"use client";

import { usePathname } from "next/navigation";

import RouteGuard from "@/components/auth/routeGuard";
import type { ChildrenProps } from "@/types/types";
import { YardProvider } from "@/components/yard/YardProvider";
import YardShell from "@/components/yard/YardShell";

const yardRoles = ["FloorStaff", "Administrator"] as const;

export default function YardAccess({ children }: ChildrenProps) {
  const pathname = usePathname();

  if (pathname.replace(/\/$/, "") === "/yard/offline") {
    return children;
  }

  return (
    <RouteGuard allowedRoles={yardRoles}>
      <YardProvider>
        <YardShell>{children}</YardShell>
      </YardProvider>
    </RouteGuard>
  );
}
