import RouteGuard from "@/components/auth/routeGuard";
import type { ChildrenProps } from "@/types/types";

export default function SettingsLayout({ children }: ChildrenProps) {
  return <RouteGuard>{children}</RouteGuard>;
}
