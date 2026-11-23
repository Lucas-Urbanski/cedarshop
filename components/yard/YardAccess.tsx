"use client";

// app/yard/layout.tsx has to stay a server component so it can export the PWA
// metadata, so the client guard and shell for the yard routes live here.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";
import { YardProvider, useYard } from "@/components/yard/YardProvider";

const yardRoles = ["FloorStaff", "Administrator"] as const;

const navigation: readonly WorkspaceNavigationItem[] = [
  { href: "/yard", label: "Inventory", icon: "inventory" },
  { href: "/yard/workOrders", label: "Work orders", icon: "orders" },
  { href: "/yard/losses", label: "Loss reports", icon: "alert" },
];

function YardShell({ children }: ChildrenProps) {
  const { notice, ready } = useYard();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    updateConnection();

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    // The yard workspace is the offline-capable part of the app.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/yardServiceWorker.js", { scope: "/yard/" })
        .catch((error: unknown) => {
          console.error("Could not register the yard service worker.", error);
        });
    }

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  return (
    <WorkspaceShell
      workspaceName="Yard operations"
      navigation={navigation}
      className="yard-app"
      contentClassName="yard-workspace-main"
    >
      <main id="yard-main" className="yard-main">
        {notice && (
          <div className="yard-notice" role="status">
            {notice}
          </div>
        )}

        {!online && (
          <div className="yard-notice" role="status">
            You are offline. Changes will save once the connection returns.
          </div>
        )}

        {ready ? children : <p role="status">Loading yard workspace…</p>}
      </main>
    </WorkspaceShell>
  );
}

export default function YardAccess({ children }: ChildrenProps) {
  const pathname = usePathname();

  // The offline fallback is served by the service worker and must not be
  // wrapped in the provider, which needs a live Firestore connection.
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
