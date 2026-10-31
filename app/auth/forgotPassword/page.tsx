"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  authAlertClassName,
  authButtonClassName,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
} from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";
import { auth } from "@/utils/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth/login`,
      });
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      title={success ? "Check your email" : "Reset your password"}
      description={
        success
          ? "Password reset instructions have been sent."
          : "Enter your email and we'll send you a link to reset your password."
      }
    >
      {success ? (
        <div className="space-y-6 text-center">
          <p className="text-sm leading-relaxed text-porcelain/80">
            If you registered using your email and password, you will receive a
            password reset email.
          </p>
          <Link href="/auth/login" className={authButtonClassName}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label htmlFor="email" className={authLabelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={authInputClassName}
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
            {isLoading ? "Sending..." : "Send reset email"}
          </button>
          <p className="text-center text-sm text-taupe">
            Remembered your password?{" "}
            <Link href="/auth/login" className={`ml-1 ${authLinkClassName}`}>
              Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthPageShell>
  );
}
