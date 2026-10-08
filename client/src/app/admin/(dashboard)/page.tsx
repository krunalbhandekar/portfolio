import type { Metadata } from "next";
import { DashboardOverview } from "@/components/admin/dashboard-overview";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <DashboardOverview />;
}
