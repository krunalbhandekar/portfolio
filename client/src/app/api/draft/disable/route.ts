import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Leaves Draft Mode (POST from the preview banner's form) and returns to the same page. */
export async function POST(request: Request) {
  const form = await request.formData();
  const path = String(form.get("path") ?? "/");
  (await draftMode()).disable();
  redirect(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
