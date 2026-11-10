"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type {
  WorkspaceIcon,
  WorkspaceNavigationItem,
  WorkspaceShellProps,
} from "@/types/types";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  PackagePlus,
  Settings,
  Smartphone,
  Store,
  Truck,
  UserRoundCog,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logoutButton";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";
import logo from "@/images/CedarShopLogo.png";

const navigationIcons: Record<WorkspaceIcon, LucideIcon> = {
  account: UserRoundCog,
  alert: AlertTriangle,
  dashboard: LayoutDashboard,
  inventory: Package,
  mapPin: MapPin,
  mobile: Smartphone,
  newOrder: PackagePlus,
  orders: ClipboardList,
  settings: Settings,
  store: Store,
  truck: Truck,
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function WorkspaceShell({
  children,
  workspaceName,
  navigation,
  className = "",
  contentClassName = "",
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState("");
  const displayName = useAuthDisplayName("Team member");
  const isSettingsPage =
    pathname === "/settings" || pathname.startsWith("/settings/");
  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  const matchingNavigation = navigation
    .filter(({ href }) => isActiveRoute(pathname, href.split("#")[0]))
    .sort((left, right) => right.href.length - left.href.length);
  const activeItem =
    matchingNavigation.find(
      ({ href }) =>
        href.includes("#") && currentHash !== "" && href.endsWith(currentHash),
    ) ??
    matchingNavigation.find(({ href }) => !href.includes("#")) ??
    matchingNavigation[0];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className={`workspace-app ${className}`.trim()}>
      <a className="workspace-skip" href="#workspace-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar">
        <nav
          className="workspace-nav"
          aria-label={`${workspaceName} navigation`}
        >
          {navigation.map(({ label, href, icon }) => {
            const active = activeItem?.href === href;
            const Icon = navigationIcons[icon];

            return (
              <Link
                href={href}
                key={href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <span className="workspace-nav-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="workspace-nav-label">{label}</span>
                {active ? (
                  <ChevronRight
                    className="workspace-nav-chevron"
                    size={16}
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="workspace-sidebar-bottom">
          <div className="workspace-sidebar-profile">
            <span className="workspace-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="workspace-sidebar-profile-copy">
              <strong>{displayName}</strong>
              <small>{workspaceName}</small>
            </span>
          </div>
          <LogoutButton className="workspace-logout" />
        </div>
      </aside>

      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-topbar-heading">
            <Link
              href="/"
              className="workspace-header-brand"
              aria-label="Cedar Shop home"
            >
              <Image
                src={logo}
                alt="Cedar Shop"
                width={120}
                height={120}
                priority
                className="workspace-header-logo"
              />
            </Link>
          </div>
          <div className="workspace-top-actions">
            <span className="workspace-user-name">{displayName}</span>
            <LogoutButton className="workspace-top-logout" />
            {isSettingsPage ? (
              <button
                type="button"
                className="workspace-back-button"
                onClick={() => router.back()}
              >
                Back
              </button>
            ) : null}
            {!isSettingsPage ? (
              <Link href="/settings" className="workspace-theme-button">
                Settings
              </Link>
            ) : null}
          </div>
        </header>

        <div
          id="workspace-content"
          className={`workspace-main ${contentClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
