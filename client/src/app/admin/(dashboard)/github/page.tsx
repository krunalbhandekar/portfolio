import type { Metadata } from "next";
import { GithubEditor } from "@/components/admin/resources/routes";

export const metadata: Metadata = { title: "GitHub" };

export default function Page() {
  return <GithubEditor />;
}
