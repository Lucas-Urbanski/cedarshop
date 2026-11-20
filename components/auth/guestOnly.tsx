"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { ChildrenProps } from "@/types/types";
import { auth } from "@/utils/firebase";
import {
  confirmEmailVerified,
  getRoleHome,
  loadSignedInAccount,
} from "@/utils/userProfile";

export function GuestOnly({ children }: ChildrenProps) {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isCurrent) return;

        if (firebaseUser) {
          setIsGuest(false);
          setError(null);
          if (!(await confirmEmailVerified(firebaseUser))) {
            router.replace("/");
            return;
          }

          try {
            const { role } = await loadSignedInAccount(firebaseUser);
            if (isCurrent) router.replace(getRoleHome(role));
          } catch (caughtError) {
            if (isCurrent) {
              console.error("Could not verify the signed-in account.", caughtError);
              setError("We couldn't verify your account. Please return home.");
            }
          }
          return;
        }

        setError(null);
        setIsGuest(true);
      },
      (error) => {
        if (isCurrent) {
          console.error("Could not verify authentication state.", error);
          setError("We couldn't verify your authentication. Please try again.");
          setIsGuest(false);
        }
      },
    );

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <main className="loadingState" role="alert">
        <p>{error}</p>
        <Link href="/">Return home</Link>
      </main>
    );
  }

  if (!isGuest) {
    return (
      <main className="loadingState" aria-label="Checking authentication">
        <div className="loadingSpinner" />
      </main>
    );
  }

  return children;
}
