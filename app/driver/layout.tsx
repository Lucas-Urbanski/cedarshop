"use client";

import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type {
  ChildrenProps,
  WorkspaceNavigationItem,
} from "@/types/types";
import "@/styles/driver.css";

const driverRoles = ["Driver", "Administrator"] as const;

const navigation: readonly WorkspaceNavigationItem[] = [
  {
    href: "/driver/dashboard",
    label: "Delivery board",
    icon: "dashboard",
  },
  {
    href: "/driver/dashboard#stops",
    label: "Route stops",
    icon: "mapPin",
  },
];

export default function DriverLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard allowedRoles={driverRoles}>
      <WorkspaceShell
        workspaceName="Driver"
        navigation={navigation}
        className="driver-app"
        contentClassName="driver-workspace-main"
      >
        <main id="driver-main" className="driver-main">
          <div className="driver-prototype-note">
            <span aria-hidden="true" />
            Driver workspace
            <span>Live delivery updates</span>
          </div>
          {children}
          <footer className="driver-footer">
            THE CEDAR SHOP <span>Driver workspace · Live operations</span>
          </footer>
        </main>
      </WorkspaceShell>
    </RouteGuard>
  );
}
