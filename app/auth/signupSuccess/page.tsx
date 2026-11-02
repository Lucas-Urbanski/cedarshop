import { Check, Mail } from "lucide-react";
import Link from "next/link";
import { authButtonClassName } from "@/components/auth/authFields";
import { AuthPageShell } from "@/components/auth/authPageShell";
import { GuestOnly } from "@/components/auth/guestOnly";

export default function Page() {
  return (
    <GuestOnly>
      <AuthPageShell title="Thank you for signing up!" description="">
        <div className="text-center">
          <div className="authSuccessIcon">
            <Mail size={24} />
          </div>
          <div className="authSuccessLabel">
            <Check size={16} />
            Account created
          </div>
          <p className="authMuted authCenteredText">
            Didn&apos;t receive it? Try signing in to send another verification
            email.
          </p>
          <Link href="/auth/login" className={`mt-8 ${authButtonClassName}`}>
            Go to sign in
          </Link>
        </div>
      </AuthPageShell>
    </GuestOnly>
  );
}
