"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brandLogo";

const navLinks = [
  { label: "Dashboard", href: "/portal" },
  { label: "Orders", href: "/portal/orders" },
  { label: "New Order", href: "/portal/orders/new" },
  { label: "Deliveries", href: "/portal/deliveries" },
  { label: "Settings", href: "/settings" },
];

export default function CustomerNavbar() {
  const pathname = usePathname();

  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Link
          href="/"
          className="brand brandLink"
          aria-label="Cedar Shop portal"
        >
          <BrandLogo />
        </Link>

        <nav className="headerActions" aria-label="Customer navigation">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href === "/settings" && pathname.startsWith("/settings/"));

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive ? "button buttonPrimary" : "button buttonSettings"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
