"use client";

import { useEffect, useState } from "react";

import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";
import { useYard } from "./YardProvider";

const navigation: readonly WorkspaceNavigationItem[] = [
  { href: "/yard", label: "Inventory", icon: "inventory" },
  { href: "/yard/workOrders", label: "Work orders", icon: "orders" },
  { href: "/yard/losses", label: "Loss reports", icon: "alert" },
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
        {/* YardProvider reports every failed or completed save here; without it
            a floor staff change can fail without any feedback. */}
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
