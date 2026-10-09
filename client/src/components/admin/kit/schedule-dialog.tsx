"use client";

import { useId, useState } from "react";
import { CalendarClock, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/** `Date` → value for <input type="datetime-local"> in the browser's time zone. */
const toLocalInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

/**
 * "Schedule…" for the publish control (portfolio.md §4 #5). The time is entered in the admin's
 * own time zone; the job that publishes it runs every 15 minutes.
 */
export function ScheduleDialog({
  open,
  onOpenChange,
  initial,
  pending,
  onSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: string | null;
  pending?: boolean;
  onSchedule: (publishAt: Date) => void;
}) {
  const id = useId();
  // Default: the next full hour. Computed once (lazy state), not on every render.
  const [value, setValue] = useState(() => {
    if (initial) return toLocalInput(new Date(initial));
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return toLocalInput(nextHour);
  });
  const [min] = useState(() => {
    const soon = new Date();
    soon.setMinutes(soon.getMinutes() + 2);
    return toLocalInput(soon);
  });
  const [error, setError] = useState<string | null>(null);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>Schedule publishing</DialogTitle>
        <DialogDescription>
          It goes live automatically within 15 minutes of this time. Until then it stays hidden.
        </DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const date = new Date(value);
            if (Number.isNaN(date.getTime()) || date < new Date(new Date().getTime() + 60_000)) {
              setError("Pick a time in the future.");
              return;
            }
            setError(null);
            onSchedule(date);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
              Publish at
            </label>
            <Input
              id={id}
              type="datetime-local"
              value={value}
              min={min}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint`}
              className="h-10"
            />
            <p id={`${id}-hint`} className="text-xs text-muted-foreground">
              {error ? <span className="text-destructive">{error} </span> : null}
              Time zone: {zone}
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <CalendarClock aria-hidden="true" />
            )}
            Schedule
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
