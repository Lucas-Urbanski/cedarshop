"use client";

import Link from "next/link";
import { Trees } from "lucide-react";
import type { UserProfile } from "@/types/types";

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Link href="/" className="brand">
          <div className="brandIcon">
            <Trees className="iconLarge" />
          </div>

          <span className="brandName">
            The Cedar Shop LMS
          </span>
        </Link>

        <div>
          {user ? (
            <div className="headerActions">
              <span className="greeting">
                Hello, {user.name}
              </span>

              <Link
                href="/settings"
                className="button buttonSettings"
              >
                Settings
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="button buttonPrimary"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}