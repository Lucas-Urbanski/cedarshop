import CustomerNavbar from "@/components/customer/CustomerNavbar";
import RouteGuard from "@/components/auth/routeGuard";
import type { ChildrenProps } from "@/types/types";

export default function PortalLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard allowedRoles={["Customer", "Administrator"]}>
      <div className="portalTheme appShell">
        <CustomerNavbar />
        <div className="portalMain">{children}</div>
      </div>
    </RouteGuard>
  );
}
