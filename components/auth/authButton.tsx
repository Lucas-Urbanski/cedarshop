"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { LogoutButton } from "./logoutButton";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      },
      (error) => {
        setAuthError(error.message);
        setIsLoading(false);
      },
    );
  }, []);

  if (isLoading) return null;

  if (authError) {
    return <p role="alert">{authError}</p>;
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="max-w-40 truncate text-sm text-porcelain/90">
        Hey, {user.displayName || user.email}!
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Link
        href="/auth/login"
        className="inline-flex h-9 items-center rounded-md border border-porcelain/40 bg-transparent px-3 text-sm text-porcelain hover:bg-white/5 hover:text-porcelain"
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="inline-flex h-9 items-center rounded-md bg-burgundy px-3 text-sm text-porcelain hover:bg-burgundy-hover"
      >
        Sign up
      </Link>
    </div>
  );
}
