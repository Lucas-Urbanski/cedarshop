import { Check, Mail } from "lucide-react";
import Link from "next/link";
import { authButtonClassName } from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";

export default function Page() {
  return (
    <AuthPageShell
      title="Thank you for signing up!"
      description="Check your inbox and spam folder for the verification email. Verify your address before signing in."
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-porcelain">
          <Mail size={24} />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-burgundy-light">
          <Check size={16} />
          Account created
        </div>
        <p className="mt-4 text-sm text-taupe">
          Didn&apos;t receive it? Try signing in to send another verification
          email.
        </p>
        <Link href="/auth/login" className={`mt-8 ${authButtonClassName}`}>
          Go to sign in
        </Link>
      </div>
    </AuthPageShell>
  );
}
