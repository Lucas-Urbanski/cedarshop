"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { ChildrenProps } from "@/types/types";
import { auth } from "@/utils/firebase";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { getRoleHome, getUserRole } from "@/utils/userProfile";

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
          if (!firebaseUser.emailVerified) {
            router.replace("/");
            return;
          }

          try {
            const profile = await getDoc(doc(db, "users", firebaseUser.uid));
            const role = getUserRole(profile.data()?.role);
            if (!profile.exists() || !role) {
              throw new Error("Your account profile could not be verified.");
            }
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
        <a href="/">Return home</a>
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
