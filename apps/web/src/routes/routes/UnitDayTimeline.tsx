import type { DutyDto } from "@repo/shared";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

export interface Block {
  startAt: string;
  endAt: string;
  label: string;
}

interface UnitDayTimelineProps {
  /** Local midnight of the day being shown. */
  dayStart: Date;
  duties: Block[];
  /** The window being composed, if it is complete. */
  draft?: Block;
  conflicts: Block[];
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Position of an instant within the day, as a percentage. */
function span(dayStart: Date, startAt: string, endAt: string) {
  const from = new Date(startAt).getTime() - dayStart.getTime();
  const to = new Date(endAt).getTime() - dayStart.getTime();

  const left = clamp((from / DAY_MS) * 100);
  const right = clamp((to / DAY_MS) * 100);

  return { left: `${left}%`, width: `${Math.max(right - left, 0.8)}%` };
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function UnitDayTimeline({
  dayStart,
  duties,
  draft,
  conflicts,
}: UnitDayTimelineProps) {
  const clashing = conflicts.length > 0;
  const conflictIds = new Set(conflicts.map((duty) => duty.startAt));

  return (
    <div className="grid gap-2">
      <div className="relative h-14 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        {HOUR_LABELS.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-zinc-800"
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            <span className="absolute top-0.5 left-1 text-[10px] text-zinc-600">
              {String(hour).padStart(2, "0")}
            </span>
          </div>
        ))}

        {duties.map((duty) => (
          <div
            key={`${duty.startAt}-${duty.label}`}
            title={`${duty.label} · ${hhmm(duty.startAt)}–${hhmm(duty.endAt)}`}
            style={span(dayStart, duty.startAt, duty.endAt)}
            className={[
              "absolute top-6 h-3.5 rounded-sm",
              conflictIds.has(duty.startAt) ? "bg-red-500" : "bg-zinc-600",
            ].join(" ")}
          />
        ))}

        {draft && (
          <div
            title={`Nuevo · ${hhmm(draft.startAt)}–${hhmm(draft.endAt)}`}
            style={span(dayStart, draft.startAt, draft.endAt)}
            className={[
              "absolute top-10 h-3.5 rounded-sm border",
              clashing
                ? "border-red-300 bg-red-500"
                : "border-lime-200 bg-lime-400",
            ].join(" ")}
          />
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-zinc-600" />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-lime-400" />
          Nuevo
        </span>
        {clashing && (
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="size-2 rounded-sm bg-red-500" />
            Conflicto
          </span>
        )}
      </div>
    </div>
  );
}

/** Same half-open rule the domain and the database use. */
export function overlaps(a: Block, b: Block) {
  return (
    new Date(a.startAt) < new Date(b.endAt) &&
    new Date(a.endAt) > new Date(b.startAt)
  );
}

export const toBlock = (duty: DutyDto, label: string): Block => ({
  startAt: duty.startAt,
  endAt: duty.endAt,
  label,
});
