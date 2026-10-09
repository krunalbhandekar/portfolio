import type { Metadata } from "next";
import { MessagesInbox } from "@/components/admin/messages/inbox";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return <MessagesInbox />;
}
