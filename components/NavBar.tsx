"use client";

import Link from "next/link";
import Image from "next/image";
import BrandLogo from "@/images/CedarShopLogo.png";
import type { NavbarProps } from "@/types/types";

export default function Navbar({ user, children }: NavbarProps) {
  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Link href="/" aria-label="Cedar Shop home">
          <Image
            src={BrandLogo}
            alt="Cedar Shop"
            width={120}
            height={120}
            priority
            className="headerLogo"
          />
        </Link>

        {children}

        <div className="headerActions">
          {user ? <span>Hello, {user.name.split(" ")[0]}</span> : null}
          {user ? (
            <>
              <Link href="/settings" className="button buttonSettings">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="button buttonSettings">
                Sign In
              </Link>
              <Link href="/auth/signup" className="button buttonPrimary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
