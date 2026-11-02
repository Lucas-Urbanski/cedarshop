"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/utils/firebase";

export default function useAuthDisplayName(fallback: string) {
  const [displayName, setDisplayName] = useState(fallback);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeProfile?.();
        unsubscribeProfile = undefined;

        if (!user) {
          setDisplayName(fallback);
          return;
        }

        const authName =
          user.displayName?.trim() || user.email?.split("@")[0] || fallback;
        setDisplayName(authName);
        unsubscribeProfile = onSnapshot(
          doc(db, "users", user.uid),
          (snapshot) => {
            const profileName = snapshot.data()?.fullName;
            setDisplayName(
              typeof profileName === "string" && profileName.trim()
                ? profileName.trim()
                : authName,
            );
          },
          (error) => {
            console.error("Could not load the signed-in user's name.", error);
          },
        );
      },
      (error) => {
        console.error("Could not determine the signed-in user.", error);
        setDisplayName(fallback);
      },
    );

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, [fallback]);

  return displayName;
}
