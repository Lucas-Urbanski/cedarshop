import type { ReactNode } from "react";
import Link from "next/link";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-graphite px-5 py-12 font-sans text-porcelain">
      <Link
        href="/"
        aria-label="Cedar Shop home"
        className="text-3xl font-semibold tracking-tight text-porcelain"
      >
        Cedar Shop
      </Link>
      <div className="mt-12 max-w-md text-center">
        <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-taupe">{description}</p>
      </div>
      <section className="mt-6 w-full max-w-[360px]">{children}</section>
    </main>
  );
}
