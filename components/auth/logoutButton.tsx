"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import type { LogoutButtonProps } from "@/types/types";

export function LogoutButton({
  className = "inline-flex h-8 items-center rounded-md border border-white/15 bg-white/5 px-3 text-xs font-medium text-porcelain transition hover:bg-white/10",
  children = "Logout",
}: LogoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      router.push("/auth/login");
      router.refresh();
    } catch (logoutError: unknown) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Sign out failed.",
      );
    }
  };

  return (
    <div>
      <button type="button" onClick={logout} className={className}>
        {children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
