import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Leaves preview mode (POST from the banner form). */
export async function POST() {
  (await draftMode()).disable();
  redirect("/");
}
