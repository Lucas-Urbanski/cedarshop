"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import BrandLogo from "@/images/CedarShopLogo.png";
import { LogoutButton } from "@/components/auth/logoutButton";
import { auth } from "@/utils/firebase";
import type { NavbarProps } from "@/types/types";

export default function Navbar({ user, children }: NavbarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isSettingsPage = pathname.startsWith("/settings");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => setIsAuthenticated(firebaseUser !== null),
      (error) => {
        console.error(
          "Could not determine whether the user is signed in.",
          error,
        );
        setIsAuthenticated(null);
      },
    );

    return unsubscribe;
  }, []);

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
          {isAuthenticated === true ? (
            <>
              {user ? (
                <span className="headerGreeting">
                  Hello,{" "}
                  <strong className="headerUserName">
                    {user.name.split(" ")[0]}
                  </strong>
                </span>
              ) : null}
              {isSettingsPage ? (
                <button
                  type="button"
                  className="button buttonSettings"
                  onClick={() => router.back()}
                >
                  Back
                </button>
              ) : (
                <Link href="/settings" className="button buttonSettings">
                  Settings
                </Link>
              )}
              <LogoutButton className="button buttonSettings" />
            </>
          ) : isAuthenticated === false ? (
            <>
              <Link href="/auth/login" className="button buttonSettings">
                Sign In
              </Link>
              <Link href="/auth/signup" className="button buttonPrimary">
                Sign Up
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
