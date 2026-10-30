
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trees } from "lucide-react";

const navLinks = [
  { label: "Dashboard", href: "/portal" },
  { label: "Orders", href: "/portal/orders" },
  { label: "New Order", href: "/portal/orders/new" },
  { label: "Deliveries", href: "/portal/deliveries" },
  { label: "Profile", href: "/portal/profile" },
];

export default function CustomerNavbar() {
  const pathname = usePathname();

  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Link href="/portal" className="brand">
          <div className="brandIcon">
            <Trees className="iconLarge" />
          </div>

          <span className="brandName">
            The Cedar Shop LMS
          </span>
        </Link>

        <nav className="headerActions" aria-label="Customer navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "button buttonPrimary"
                    : "button buttonSettings"
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
