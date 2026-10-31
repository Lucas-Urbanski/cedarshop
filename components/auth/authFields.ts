// Shared auth form styles. Kept free of "use client" so server pages can import them.
export const authLabelClassName =
  "mb-2 block text-sm font-medium text-porcelain";

export const authInputClassName =
  "h-[46px] w-full rounded-md border border-porcelain/20 bg-graphite-light px-3.5 text-sm text-porcelain outline-none transition-colors placeholder:text-taupe focus:border-burgundy-light aria-[invalid=true]:border-red-400/70";

export const authButtonClassName =
  "flex h-[46px] w-full items-center justify-center rounded-md bg-burgundy px-4 text-[15px] text-porcelain transition-colors hover:bg-burgundy-hover disabled:cursor-not-allowed disabled:opacity-60";

export const authLinkClassName = "text-burgundy-light hover:underline";

export const authFieldErrorClassName = "mt-1.5 text-sm text-red-300";

export const authAlertClassName =
  "rounded-md border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200";
