import { cacheLife } from "next/cache";

/** Prerendered year, refreshed daily so the static footer rolls over on Jan 1st. */
export async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
