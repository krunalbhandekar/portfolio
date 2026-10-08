import type { Metadata } from "next";
import { LoginCard } from "@/components/admin/login-card";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return <LoginCard />;
}
