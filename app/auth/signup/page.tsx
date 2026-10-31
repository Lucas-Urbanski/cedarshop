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
import { registerShopUser } from "@/utils/firebase";
import type { SignUpFormValues } from "@/types/types";

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function SignUpForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setAuthError(null);

    try {
      await registerShopUser(values.email, values.password, values.fullName);
      router.push("/auth/signupSuccess");
    } catch (error: unknown) {
      setAuthError(
        error instanceof Error ? error.message : "Account creation failed.",
      );
    }
  };

  return (
    <AuthPageShell
      title="Create an account"
      description=""
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label htmlFor="fullName" className={authLabelClassName}>
            Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
            {...register("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={authInputClassName}
          />
          {errors.fullName?.message && (
            <p id="fullName-error" className={authFieldErrorClassName}>
              {errors.fullName.message}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            placeholder="Create your password"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password?.message && (
            <p id="password-error" className={authFieldErrorClassName}>
              {errors.password.message}
            </p>
          )}
        </div>

        {authError && (
          <p role="alert" className={authAlertClassName}>
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`!mt-9 ${authButtonClassName}`}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <GoogleSignInButton />

      <p className="authMuted authCenteredText">
        Already have an account?{" "}
        <Link href="/auth/login" className={`ml-1 ${authLinkClassName}`}>
          Sign In
        </Link>
      </p>
    </AuthPageShell>
  );
}
