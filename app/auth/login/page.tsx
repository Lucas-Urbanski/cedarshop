"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  authAlertClassName,
  authButtonClassName,
  authFieldErrorClassName,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
} from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";
import { GoogleSignInButton } from "@/components/auth/googleSignInButton";
import { PasswordInput } from "@/components/auth/passwordInput";
import { auth } from "@/utils/firebase";
import type { SignInFormValues } from "@/types/types";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export default function LoginForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInFormValues) => {
    setAuthError(null);

    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
        } finally {
          await signOut(auth);
        }
        throw new Error(
          "Please verify your email before signing in. Check your inbox for the verification link.",
        );
      }
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;

      setAuthError(
        code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
        ? "Incorrect email or password."
          : code === "permission-denied"
          ? "Sign-in failed. Please try again."
            : error instanceof Error
              ? error.message
              : "Sign in failed.",
      );
    }
  };

  return (
    <AuthPageShell
      title="Welcome back"
      description=""
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={authInputClassName}
          />
          {errors.email?.message && (
            <p id="email-error" className={authFieldErrorClassName}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={authLabelClassName}>
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password?.message && (
            <p id="password-error" className={authFieldErrorClassName}>
              {errors.password.message}
            </p>
          )}
          <div className="mt-1.5 text-right">
            <Link
              href="/auth/forgotPassword"
              className={`text-[13px] ${authLinkClassName}`}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {authError && (
          <p role="alert" className={authAlertClassName}>
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`!mt-3 ${authButtonClassName}`}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

        <GoogleSignInButton />

        <p className="authMuted authCenteredText">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className={`ml-1 ${authLinkClassName}`}>
          Sign Up
        </Link>
      </p>
    </AuthPageShell>
  );
}
