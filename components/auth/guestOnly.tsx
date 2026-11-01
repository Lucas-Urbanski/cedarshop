"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { ChildrenProps } from "@/types/types";
import { auth } from "@/utils/firebase";

export function GuestOnly({ children }: ChildrenProps) {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!isCurrent) return;

        if (firebaseUser) {
          setIsGuest(false);
          router.replace("/");
          return;
        }

        setIsGuest(true);
      },
      (error) => {
        if (isCurrent) {
          console.error("Could not verify authentication state.", error);
          setIsGuest(false);
        }
      },
    );

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [router]);

  if (!isGuest) {
    return (
      <main className="loadingState" aria-label="Checking authentication">
        <div className="loadingSpinner" />
      </main>
    );
  }

  return children;
}
