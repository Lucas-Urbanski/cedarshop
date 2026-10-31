"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/utils/firebase";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      router.replace("/");
      router.refresh();
    } catch (signInError: unknown) {
      const code =
        typeof signInError === "object" &&
        signInError !== null &&
        "code" in signInError &&
        typeof signInError.code === "string"
          ? signInError.code
          : null;

      setError(
        code === "auth/account-exists-with-different-credential"
          ? "This email is already linked to another sign-in method."
          : code === "auth/invalid-credential"
            ? "Google sign-in failed. Please try again."
            : code === "auth/operation-not-allowed"
              ? "Google sign-in is unavailable. Please try another method."
              : code === "auth/unauthorized-domain"
                ? "This domain is not authorized for sign-in."
                : code === "permission-denied"
                  ? "Google sign-in failed. Please try again."
                  : signInError instanceof Error
                    ? signInError.message
                    : "Google sign-in failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="authGoogleSection">
      <div className="authDivider" aria-hidden="true">
        <span />
        <span className="authMuted">OR</span>
        <span />
      </div>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="authGoogleButton"
      >
        <span aria-hidden="true" className="authGoogleMark">
          G
        </span>
        {isLoading ? "Connecting to Google..." : "Continue with Google"}
      </button>
      {error && (
        <p role="alert" className="authFieldError">
          {error}
        </p>
      )}
    </div>
  );
}
