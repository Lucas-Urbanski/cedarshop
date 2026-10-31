import type { ReactNode } from "react";
import RouteGuard from "@/components/auth/routeGuard";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <RouteGuard>{children}</RouteGuard>;
}
