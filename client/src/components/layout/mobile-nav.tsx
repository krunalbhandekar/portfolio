"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileNavSheet = dynamic(() => import("./mobile-nav-sheet"), { ssr: false });

export function MobileNav({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  // Start fetching the sheet on intent (hover/focus/touch) so it's ready by the click.
  const [requested, setRequested] = useState(false);
  const request = () => setRequested(true);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={request}
        onFocus={request}
        onClick={() => {
          request();
          setOpen(true);
        }}
      >
        <Menu aria-hidden="true" />
      </Button>
      {requested ? <MobileNavSheet name={name} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
