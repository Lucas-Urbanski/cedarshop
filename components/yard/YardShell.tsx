"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Package,
  ClipboardList,
  TriangleAlert,
  Smartphone,
  ArrowUpRight,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Trees,
} from "lucide-react";

import logo from "@/images/CedarShopLogo.png";
import { useTheme } from "@/components/themeProvider";
import type { ChildrenProps } from "@/types/types";
import { useYard } from "./YardProvider";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";

const links = [
  { href: "/yard", label: "Overview", icon: LayoutDashboard },
  { href: "/yard/inventory", label: "Inventory", icon: Package },
  {
    href: "/yard/workOrders",
    label: "Work orders",
    icon: ClipboardList,
  },
  {
    href: "/yard/losses",
    label: "Loss reports",
    icon: TriangleAlert,
  },
  {
    href: "/yard/mobile",
    label: "Mobile PWA",
    icon: Smartphone,
  },
];

export default function YardShell({ children }: ChildrenProps) {
  const path = usePathname().replace(/\/$/, "");
  const { theme, toggleTheme } = useTheme();
  const { notice, ready } = useYard();
  const [online, setOnline] = useState(true);
  const staffName = useAuthDisplayName("Floor staff");
  const initials = staffName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    updateConnection();

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    // The production worker only covers the Yard module.
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
    <div className="yard-app">
      <a className="yard-skip" href="#yard-main">
        Skip to content
      </a>

      <aside className="yard-sidebar">
        <Link href="/" className="yard-logo">
       <Image
  src={logo}
  alt="The Cedar Shop home"
  width={120}
  height={96}
/>
        </Link>

        <div className="yard-sidebar-label">LUMBER MANAGEMENT</div>

        <nav aria-label="Yard navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={path === href ? "active" : ""}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {path === href && <span className="yard-nav-dot" />}
            </Link>
          ))}
        </nav>

        <div className="yard-sidebar-foot">
          <Trees size={28} />
          <strong>Built for the yard.</strong>

          <p>
            Stock, shop work and daily tasks.
            <br />
            All in one place.
          </p>

          <Link href="/">
            Back to storefront <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>

      <div className="yard-body">
        <header className="yard-topbar">
          <div>
            <span className="yard-breadcrumb">Workspace /</span>
            <strong>Yard operations</strong>
          </div>

          <div className="yard-top-actions">
            <span className="yard-connection">
              {online ? <Wifi size={15} /> : <WifiOff size={15} />}
              {online ? "Online" : "Offline"}
            </span>

            <button
              className="yard-icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <span className="yard-avatar" aria-label={staffName}>
              {initials}
            </span>
          </div>
        </header>

        <main id="yard-main" className="yard-main">
          <div className="yard-demo">
            <span className="yard-dot" />
            Floor staff workspace
            <span>• Firestore · Live updates</span>
          </div>

          {notice && (
            <div className="yard-notice" role="status">
              {notice}
            </div>
          )}

          {ready ? children : <p role="status">Loading yard workspace…</p>}
        </main>

        <footer className="yard-footer">
          THE CEDAR SHOP
          <span>Yard workspace · Live operations</span>
        </footer>
      </div>
    </div>
  );
}