import type { Metadata } from "next";
import { HomepageEditor } from "@/components/admin/resources/routes";

export const metadata: Metadata = { title: "Homepage" };

export default function Page() {
  return <HomepageEditor />;
}
