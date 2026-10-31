import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOjp11Q38wtRZq0o_fe2n3otZvAxoQgr4",
  authDomain: "cedarshoplms.firebaseapp.com",
  projectId: "cedarshoplms",
  storageBucket: "cedarshoplms.firebasestorage.app",
  messagingSenderId: "281111715337",
  appId: "1:281111715337:web:59d743a0e415101ff122d8",
  measurementId: "G-NY3LW3F7P9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

function getPermissionMessage(error: unknown, context: string) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";

  if (code === "permission-denied") {
    return `${context} failed. Please try again.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The request could not be completed.";
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const { user } = await signInWithPopup(auth, provider);
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName ?? "",
        role: "customer",
        createdAt: new Date(),
        shippingAddress: {
          street: "",
          city: "",
          postalCode: "",
        },
      });
    }

    return user;
  } catch (error: unknown) {
    throw new Error(getPermissionMessage(error, "Google sign-in"));
  }
}

export async function registerShopUser(
  email: string,
  password: string,
  fullName: string,
) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await sendEmailVerification(user);
    await updateProfile(user, { displayName: fullName });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName,
      role: "customer",
      createdAt: new Date(),
      shippingAddress: {
        street: "",
        city: "",
        postalCode: "",
      },
    });
  } catch (error: unknown) {
    throw new Error(getPermissionMessage(error, "Account setup"));
  } finally {
    await signOut(auth);
  }

  return user;
}
