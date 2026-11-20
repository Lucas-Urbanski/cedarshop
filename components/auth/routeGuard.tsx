"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import type { RouteGuardProps } from "@/types/types";
import { auth } from "@/utils/firebase";
import {
  confirmEmailVerified,
  getRoleHome,
  loadSignedInAccount,
} from "@/utils/userProfile";

export default function RouteGuard({
  children,
  allowedRoles,
}: RouteGuardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    let authCheck = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const currentCheck = ++authCheck;
        const isLatestCheck = () => isCurrent && currentCheck === authCheck;

        setIsAuthorized(false);
        setError(null);

        if (!firebaseUser) {
          router.replace("/auth/login");
          return;
        }

        if (!(await confirmEmailVerified(firebaseUser))) {
          router.replace("/auth/login");
          return;
        }

        try {
          const { role } = await loadSignedInAccount(firebaseUser);

          if (allowedRoles && !allowedRoles.includes(role)) {
            if (isLatestCheck()) router.replace(getRoleHome(role));
            return;
          }

          if (isLatestCheck()) setIsAuthorized(true);
        } catch (caughtError: unknown) {
          if (isLatestCheck()) {
            console.error("Could not verify access to this page.", caughtError);
            setError("We couldn't verify your account access.");
          }
        }
      },
      (authError) => {
        if (isCurrent) {
          console.error("Could not verify the signed-in user.", authError);
          setError("We couldn't verify your account access.");
        }
      },
    );

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [allowedRoles, router]);

  if (error) {
    return (
      <main className="loadingState" role="alert">
        <p>{error}</p>
        <Link href="/">Return to home</Link>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="loadingState" aria-label="Verifying account access">
        <div className="loadingSpinner" />
      </main>
    );
  }

  return children;
}
