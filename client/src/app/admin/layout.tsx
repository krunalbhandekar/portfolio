import type { Metadata } from "next";
import { AdminProviders } from "@/components/admin/admin-providers";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminProviders>{children}</AdminProviders>;
}
