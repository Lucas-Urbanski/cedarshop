"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

// Reads the visitor's local calendar date, not the UTC date.
function readLocalToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

// Prerendering happens at build time on the server, so there is no visitor
// timezone yet. An empty string keeps the static markup and the first client
// render identical; React then re-renders with the real date.
function readServerToday() {
  return "";
}

/**
 * Today's date in the visitor's timezone as `YYYY-MM-DD`, or `""` while the
 * page is still prerendering.
 */
export default function useLocalToday(): string {
  return useSyncExternalStore(
    noSubscription,
    readLocalToday,
    readServerToday,
  );
}
