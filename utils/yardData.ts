// Works when demonstrating the app over a local HTTP network.
export function newYardId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));

  const identifier = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase();

  return `${prefix}-${identifier}`;
}