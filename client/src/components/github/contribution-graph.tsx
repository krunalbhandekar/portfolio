import type { GithubData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const CELL = 11;
const GAP = 3;
/** Opacity of the accent colour per GitHub contribution level (0 = none). */
const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1];

/**
 * GitHub-style contribution calendar as a static SVG (no client JS). Colours use the site
 * accent; the table-free markup is described by an accessible summary.
 */
export function ContributionGraph({
  contributions,
  weeks: lastWeeks,
  className,
}: {
  contributions: NonNullable<GithubData["contributions"]>;
  /** Only show the most recent N weeks (e.g. a compact card). */
  weeks?: number;
  className?: string;
}) {
  const weeks = lastWeeks ? contributions.weeks.slice(-lastWeeks) : contributions.weeks;
  const width = weeks.length * (CELL + GAP) - GAP;
  const height = 7 * (CELL + GAP) - GAP;
  const counted = weeks.flatMap((w) => w.days).reduce((sum, d) => sum + d.count, 0);
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`${counted} contributions in the last ${weeks.length} weeks`}
          className="max-w-none"
        >
          {weeks.map((week, x) =>
            week.days.map((day) => {
              const y = new Date(`${day.date}T00:00:00Z`).getUTCDay();
              return (
                <rect
                  key={day.date}
                  x={x * (CELL + GAP)}
                  y={y * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  className={day.level ? "fill-brand" : "fill-muted"}
                  fillOpacity={day.level ? LEVEL_OPACITY[day.level] : 1}
                >
                  <title>{`${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`}</title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>
    </figure>
  );
}
