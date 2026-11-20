import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/utils/firebase";
import type { UserRole } from "@/types/types";

const userRoles: Record<string, UserRole> = {
  customer: "Customer",
  driver: "Driver",
  floorstaff: "FloorStaff",
  salesstaff: "SalesStaff",
  administrator: "Administrator",
};

export function getUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  return userRoles[value.toLowerCase().replace(/\s+/g, "")] ?? null;
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case "Customer":
      return "/portal";
    case "Driver":
      return "/driver/dashboard";
    case "FloorStaff":
      return "/yard";
    case "SalesStaff":
      return "/sales";
    case "Administrator":
      return "/admin";
  }
}

export interface SignedInAccount {
  role: UserRole;
  fullName: string;
  email: string;
  profile: DocumentData;
}

export function getUserDisplayName(user: User): string {
  return (
    user.displayName?.trim() || user.email?.split("@")[0] || "Cedar Shop user"
  );
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  );
}

// A session that was just established can reach Firestore before its ID token
// does, which surfaces as a spurious permission-denied. Retrying briefly keeps
// a valid account from being told its profile is unavailable.
async function readProfileDocument(uid: string): Promise<DocumentSnapshot> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await getDoc(doc(db, "users", uid));
    } catch (error: unknown) {
      if (attempt >= 3 || !isPermissionDenied(error)) throw error;

      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
}

/**
 * Firebase Auth accounts can exist without a Firestore profile (created in the
 * console, or a signup whose profile write failed). Provisioning the default
 * customer profile keeps those accounts usable instead of rejecting them at
 * sign-in.
 */
async function createDefaultProfile(user: User): Promise<DocumentData> {
  const profile = {
    uid: user.uid,
    email: user.email ?? "",
    fullName: getUserDisplayName(user),
    role: "customer",
    createdAt: new Date(),
    shippingAddress: {
      street: "",
      city: "",
      postalCode: "",
    },
  };

  await setDoc(doc(db, "users", user.uid), profile);

  return profile;
}

/**
 * Resolves the signed-in user's role and name, repairing a missing profile and
 * surviving a transient profile read failure. Callers get a usable account
 * instead of a dead end, so a valid user is never blocked by profile lookup.
 */
export async function loadSignedInAccount(
  user: User,
): Promise<SignedInAccount> {
  const fallbackName = getUserDisplayName(user);
  const email = user.email ?? "";

  let snapshot: DocumentSnapshot;

  try {
    snapshot = await readProfileDocument(user.uid);
  } catch (error: unknown) {
    console.error("Could not read the signed-in user's profile.", error);
    return { role: "Customer", fullName: fallbackName, email, profile: {} };
  }

  if (!snapshot.exists()) {
    try {
      const profile = await createDefaultProfile(user);
      return { role: "Customer", fullName: fallbackName, email, profile };
    } catch (error: unknown) {
      console.error("Could not create the missing user profile.", error);
      return { role: "Customer", fullName: fallbackName, email, profile: {} };
    }
  }

  const profile = snapshot.data();
  const storedRole = getUserRole(profile.role);

  if (!storedRole) {
    console.warn(
      `Unrecognized role "${String(profile.role)}" for ${user.uid}; using the customer workspace.`,
    );
  }

  const storedName =
    typeof profile.fullName === "string" && profile.fullName.trim()
      ? profile.fullName.trim()
      : fallbackName;

  return {
    role: storedRole ?? "Customer",
    fullName: storedName,
    email,
    profile,
  };
}

/**
 * A user who verified their email in another tab can still hold a stale
 * unverified token. Refreshing it avoids telling them to verify again.
 */
export async function confirmEmailVerified(user: User): Promise<boolean> {
  if (user.emailVerified) return true;

  try {
    await user.reload();

    const refreshed = auth.currentUser ?? user;

    if (!refreshed.emailVerified) return false;

    await refreshed.getIdToken(true);

    return true;
  } catch (error: unknown) {
    console.error("Could not refresh the email verification state.", error);
    return user.emailVerified;
  }
}
