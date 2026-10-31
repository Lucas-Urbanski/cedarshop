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
          ? "An account already exists with this email. Sign in using your existing method."
          : code === "auth/invalid-credential"
            ? "Firebase rejected the Google sign-in credential. Check that Google is enabled in Firebase Authentication and that its OAuth configuration is correct."
            : code === "auth/operation-not-allowed"
              ? "Google sign-in is disabled for this Firebase project. Enable the Google provider in Firebase Authentication settings."
              : code === "auth/unauthorized-domain"
                ? "This site’s domain is not authorized for Firebase sign-in. Add it under Firebase Authentication's authorized domains."
          : signInError instanceof Error
            ? signInError.message
            : "Google sign-in failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-porcelain/20" />
        <span className="text-xs text-taupe">OR</span>
        <span className="h-px flex-1 bg-porcelain/20" />
      </div>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-md border border-porcelain/25 bg-graphite-light px-4 text-sm text-porcelain transition-colors hover:bg-porcelain/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true" className="font-bold text-base text-[#4285f4]">
          G
        </span>
        {isLoading ? "Connecting to Google..." : "Continue with Google"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
