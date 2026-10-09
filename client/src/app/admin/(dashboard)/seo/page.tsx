import type { Metadata } from "next";
import { SeoManager } from "@/components/admin/seo-manager";

export const metadata: Metadata = { title: "SEO" };

export default function Page() {
  return <SeoManager />;
}
