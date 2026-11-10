"use client";

import { useEffect, useState } from "react";

import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";
import { useYard } from "./YardProvider";

const navigation: readonly WorkspaceNavigationItem[] = [
  { href: "/yard", label: "Overview", icon: "dashboard" },
  { href: "/yard/inventory", label: "Inventory", icon: "inventory" },
  { href: "/yard/workOrders", label: "Work orders", icon: "orders" },
  { href: "/yard/losses", label: "Loss reports", icon: "alert" },
  { href: "/yard/mobile", label: "Mobile PWA", icon: "mobile" },
];

export default function YardShell({ children }: ChildrenProps) {
  const { notice, ready } = useYard();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    updateConnection();

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
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
        <div className="yard-demo">
          <span className="yard-dot" />
          Floor staff workspace
          <span>
            • Firestore · Live updates · {online ? "Online" : "Offline"}
          </span>
        </div>

        {notice && (
          <div className="yard-notice" role="status">
            {notice}
          </div>
        )}

        {ready ? children : <p role="status">Loading yard workspace…</p>}
        <footer className="yard-footer">
          THE CEDAR SHOP
          <span>Yard workspace · Live operations</span>
        </footer>
      </main>
    </WorkspaceShell>
  );
}
