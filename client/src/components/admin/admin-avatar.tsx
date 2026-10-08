import Image from "next/image";
import type { AdminUser } from "@/hooks/use-auth";

export function AdminAvatar({ admin }: { admin: AdminUser }) {
  if (admin.avatar) {
    return (
      <Image
        src={admin.avatar}
        alt=""
        width={28}
        height={28}
        className="size-7 rounded-full border"
        referrerPolicy="no-referrer"
        unoptimized
      />
    );
  }
  const initials = admin.name
    ? admin.name
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : admin.email.slice(0, 2).toUpperCase();
  return (
    <span className="flex size-7 items-center justify-center rounded-full border bg-surface font-mono text-[0.65rem]">
      {initials}
    </span>
  );
}
