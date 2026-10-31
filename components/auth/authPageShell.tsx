import Link from "next/link";
import Image from "next/image";
import BrandLogo from "@/images/CedarShopLogo.png";
import type { AuthPageShellProps } from "@/types/types";

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="authPage">
      <section className="authCard">
        <Link
          href="/"
          aria-label="Cedar Shop home"
          className="authBrand"
        >
          <Image
            src={BrandLogo}
            alt="Cedar Shop"
            width={200}
            height={200}
            priority
            className="authLogo"
          />
        </Link>

        <div className="authHeading">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>

        <div className="authContent">{children}</div>
      </section>
    </main>
  );
}
