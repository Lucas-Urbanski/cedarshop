"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Moon, Sun, Truck } from "lucide-react";
import { useTheme } from "@/components/themeProvider";
import logo from "@/images/CedarShopLogo.png";

const navigation = [
  { href: "/driver/dashboard", label: "Delivery board", icon: LayoutDashboard },
  { href: "/driver/dashboard#stops", label: "Route stops", icon: MapPin },
];

export default function DriverShell({
  children,
  previewMode = false,
}: {
  children: React.ReactNode;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="driver-app">
      <a className="driver-skip" href="#driver-main">
        Skip to content
      </a>

      <aside className="driver-sidebar">
        <Link href="/" className="driver-logo" aria-label="Cedar Shop home">
          <Image src={logo} alt="The Cedar Shop" width={120} height={96} />
        </Link>

        <p className="driver-sidebar-label">DELIVERY OPERATIONS</p>
        <nav className="driver-nav" aria-label="Driver navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const target = previewMode
              ? href.replace("/driver/dashboard", "/driver-preview")
              : href;
            const active =
              pathname === "/driver/dashboard" ||
              (previewMode && pathname === "/driver-preview");
            return (
              <Link
                href={target}
                key={label}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {active && <span className="driver-nav-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="driver-sidebar-foot">
          <Truck size={26} aria-hidden="true" />
          <strong>Every stop, in reach.</strong>
          <p>Your route and delivery details, all in one place.</p>
          <Link href="/">Back to storefront</Link>
        </div>
      </aside>

      <div className="driver-body">
        <header className="driver-topbar">
          <div className="driver-breadcrumb">
            <span>Workspace /</span>
            <strong>Driver delivery board</strong>
          </div>
          <div className="driver-top-actions">
            <span className="driver-profile">
              <span className="driver-avatar" aria-hidden="true">BN</span>
              <span>
                <strong>Bao Nguyen</strong>
                <small>Delivery driver</small>
              </span>
            </span>
            <button
              type="button"
              className="driver-theme-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main id="driver-main" className="driver-main">
          <div className="driver-prototype-note">
            <span aria-hidden="true" />
            Driver workspace prototype
            <span>Sample route · Front end only</span>
          </div>
          {children}
          <footer className="driver-footer">
            THE CEDAR SHOP <span>Driver workspace · Phase 1 prototype</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
