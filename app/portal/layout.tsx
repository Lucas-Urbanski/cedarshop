
import type { ReactNode } from "react";
import CustomerNavbar from "@/components/customer/CustomerNavbar";
import RouteGuard from "@/components/auth/routeGuard";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["Customer", "Administrator"]}>
      <div className="portalTheme appShell">
        <CustomerNavbar />
        <div className="portalMain">{children}</div>
      </div>
    </RouteGuard>
  );
}
