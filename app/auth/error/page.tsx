"use client";

import { Suspense } from "react";
import { authButtonClassName } from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      {error ? (
        <p className="text-sm text-red-300">Code error: {error}</p>
      ) : (
        <p className="text-sm text-porcelain/80">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page() {
  return (
    <AuthPageShell
      title="Sorry, something went wrong."
      description="We couldn’t complete that sign-in request."
    >
      <div className="space-y-6 text-center">
        <Suspense
          fallback={<p className="text-sm text-taupe">Loading error details...</p>}
        >
          <ErrorContent />
        </Suspense>
        <Link href="/auth/login" className={authButtonClassName}>
          Return to sign in
        </Link>
      </div>
    </AuthPageShell>
  );
}
