import type { Metadata } from "next";
import { AboutEditor } from "@/components/admin/resources/routes";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <AboutEditor />;
}
