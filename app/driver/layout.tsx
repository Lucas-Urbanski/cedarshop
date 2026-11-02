"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Moon,
  Sun,
  Truck,
} from "lucide-react";
import { useTheme } from "@/components/themeProvider";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";
import RouteGuard from "@/components/auth/routeGuard";
import logo from "@/images/CedarShopLogo.png";
import "@/styles/driver.css";

const driverRoles = ["Driver", "Administrator"] as const;

const navigation = [
  {
    id: "board",
    href: "/driver/dashboard",
    label: "Delivery board",
    detail: "Your day at a glance",
    icon: LayoutDashboard,
  },
  {
    id: "stops",
    href: "/driver/dashboard#stops",
    label: "Route stops",
    detail: "Loads and destinations",
    icon: MapPin,
  },
];

export default function DriverShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const driverName = useAuthDisplayName("Driver");
  const [activeSection, setActiveSection] = useState("board");
  const driverInitials = driverName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const syncActiveSection = () => {
      setActiveSection(window.location.hash === "#stops" ? "stops" : "board");
    };

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, [pathname]);

  return (
    <RouteGuard allowedRoles={driverRoles}>
    <div className="driver-app">
      <a className="driver-skip" href="#driver-main">
        Skip to content
      </a>

      <aside className="driver-sidebar">
        <Link href="/" className="driver-brand" aria-label="Cedar Shop home">
          <span className="driver-brand-mark">
            <Image src={logo} alt="" width={54} height={44} priority />
          </span>
          <span className="driver-brand-copy">
            <strong>CEDAR SHOP</strong>
            <small>DRIVER WORKSPACE</small>
          </span>
          <ArrowUpRight
            className="driver-brand-arrow"
            size={16}
            aria-hidden="true"
          />
        </Link>

        <div className="driver-nav-heading">
          <span className="driver-sidebar-label">WORKSPACE</span>
          <span className="driver-nav-heading-line" />
        </div>
        <nav className="driver-nav" aria-label="Driver navigation">
          {navigation.map(({ id, href, label, detail, icon: Icon }) => {
            const active =
              pathname === "/driver/dashboard" && activeSection === id;
            return (
              <Link
                href={href}
                key={id}
                className={active ? "active" : ""}
                aria-current={active ? "location" : undefined}
                onClick={() => setActiveSection(id)}
              >
                <span className="driver-nav-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="driver-nav-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ChevronRight
                  className="driver-nav-chevron"
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <section className="driver-route-card" aria-label="Route workspace">
          <span className="driver-route-card-icon">
            <Truck size={19} aria-hidden="true" />
          </span>
          <span className="driver-route-card-label">ON THE MOVE</span>
          <strong>Your route, made simple.</strong>
          <p>Stops, load details, and directions together in one place.</p>
          <span className="driver-route-card-decoration" aria-hidden="true">
            <MapPin size={88} strokeWidth={1} />
          </span>
        </section>

        <div className="driver-sidebar-bottom">
          <div className="driver-sidebar-profile">
            <span className="driver-avatar" aria-hidden="true">
              {driverInitials}
            </span>
            <span className="driver-sidebar-profile-copy">
              <strong>{driverName}</strong>
              <small>Delivery driver</small>
            </span>
            <span className="driver-profile-status" aria-label="Signed in" />
          </div>
          <Link href="/" className="driver-store-link">
            <span>Back to storefront</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className="driver-body">
        <header className="driver-topbar">
          <div className="driver-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>Driver delivery board</strong>
          </div>
          <div className="driver-top-actions">
            <span className="driver-profile">
              <span className="driver-avatar" aria-hidden="true">{driverInitials}</span>
              <span>
                <strong>{driverName}</strong>
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
            Driver workspace
            <span>Live delivery updates</span>
          </div>
          {children}
          <footer className="driver-footer">
            THE CEDAR SHOP <span>Driver workspace · Live operations</span>
          </footer>
        </main>
      </div>
    </div>
    </RouteGuard>
  );
}
