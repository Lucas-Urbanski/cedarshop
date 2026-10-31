"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  authAlertClassName,
  authButtonClassName,
  authLabelClassName,
} from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";
import { PasswordInput } from "@/components/auth/passwordInput";
import { auth } from "@/utils/firebase";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionCode, setActionCode] = useState<string | null | undefined>(
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    const mode = params.get("mode");
    let isCurrent = true;
    void Promise.resolve()
      .then(() => {
        if (mode !== "resetPassword" || !code) {
          throw new Error("This password reset link is invalid or has expired.");
        }
        return verifyPasswordResetCode(auth, code);
      })
      .then(() => {
        if (isCurrent && code) setActionCode(code);
      })
      .catch((verificationError: unknown) => {
        if (isCurrent) {
          setActionCode(null);
          setError(
            verificationError instanceof Error
              ? verificationError.message
              : "This password reset link is invalid or has expired.",
          );
        }
      })

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!actionCode) {
        throw new Error("This password reset link is invalid or has expired.");
      }
      await confirmPasswordReset(auth, actionCode, password);
      router.push("/auth/login");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Choose a new password"
      description="Enter your new password below to secure your account."
    >
      {actionCode === undefined ? (
        <p className="text-center text-sm text-taupe">Checking reset link...</p>
      ) : actionCode !== null ? (
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label htmlFor="password" className={authLabelClassName}>
              New password
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="Enter your new password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className={authAlertClassName}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={authButtonClassName}
          >
            {isLoading ? "Saving..." : "Save new password"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <p role="alert" className={authAlertClassName}>
            {error ?? "This password reset link is invalid or has expired."}
          </p>
          <Link href="/auth/forgotPassword" className={authButtonClassName}>
            Request another reset link
          </Link>
        </div>
      )}
    </AuthPageShell>
  );
}
