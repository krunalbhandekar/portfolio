import type { Metadata } from "next";
import { PagesEditor } from "@/components/admin/pages-editor";

export const metadata: Metadata = { title: "Now / Uses / FAQ" };

export default function Page() {
  return <PagesEditor />;
}
