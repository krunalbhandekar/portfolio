import type { Metadata } from "next";
import { BackupManager } from "@/components/admin/backup-manager";

export const metadata: Metadata = { title: "Backup" };

export default function Page() {
  return <BackupManager />;
}
