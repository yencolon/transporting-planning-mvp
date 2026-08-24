import { useState } from "react";
import type { DutyDto } from "@repo/shared";
import { Link } from "react-router-dom";
import { useUnitDuties } from "../queries/duties";
import { useRoutes } from "../queries/routes";
import { ErrorMessage, Loading } from "./StatusMessage";
import { UnitDayTimeline, toBlock } from "./UnitDayTimeline";

const timeFormat = new Intl.DateTimeFormat("es-DO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dayKey = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const dayStart = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month, day);
};

/** Same identity the timeline uses for a block, so hover links the two views. */
const dutyKey = (duty: DutyDto) => `${duty.startAt}|${duty.endAt}`;

/** A unit's duties; mounted only when the card is expanded, so it fetches lazily. */
export function UnitDutiesList({ unitId }: { unitId: string }) {
  const { data: duties, isPending, error } = useUnitDuties(unitId);
  const { data: routes } = useRoutes();

  if (isPending) {
    return <Loading label="Cargando duties…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (duties.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Esta unidad no tiene duties.</p>
    );
  }

  return <DutiesView duties={duties} routes={routes ?? []} />;
}

interface RouteSummary {
  id: string;
  name: string;
}

function DutiesView({
  duties,
  routes,
}: {
  duties: DutyDto[];
  routes: RouteSummary[];
}) {
  const routeName = (routeId: string) =>
    routes.find((route) => route.id === routeId)?.name ?? "Ruta desconocida";

  const days = new Map<string, DutyDto[]>();
  for (const duty of duties) {
    const key = dayKey(duty.startAt);
    days.set(key, [...(days.get(key) ?? []), duty]);
  }
  const sortedKeys = [...days.keys()].sort(
    (a, b) => dayStart(a).getTime() - dayStart(b).getTime(),
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredDuty, setHoveredDuty] = useState<string | null>(null);
  const activeKey =
    selectedKey && days.has(selectedKey)
      ? selectedKey
      : (sortedKeys.at(-1) as string);

  const dayDuties = [...(days.get(activeKey) ?? [])].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  return (
    <div className="grid gap-3">
      {sortedKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                key === activeKey
                  ? "border-lime-400/60 bg-lime-400/10 text-lime-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {dayStart(key).toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
              })}
            </button>
          ))}
        </div>
      )}

      <UnitDayTimeline
        dayStart={dayStart(activeKey)}
        duties={dayDuties.map((duty) => toBlock(duty, routeName(duty.routeId)))}
        conflicts={[]}
        activeKey={hoveredDuty}
        onHover={setHoveredDuty}
      />

      <ul className="grid gap-2">
        {dayDuties.map((duty) => (
          <li
            key={duty.id}
            onMouseEnter={() => setHoveredDuty(dutyKey(duty))}
            onMouseLeave={() => setHoveredDuty(null)}
            className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              dutyKey(duty) === hoveredDuty
                ? "border-lime-400/60 bg-zinc-800"
                : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <Link
              to={`/routes/${duty.routeId}`}
              className="font-medium text-zinc-100 transition hover:text-lime-300"
            >
              {routeName(duty.routeId)}
            </Link>
            <span className="text-xs text-zinc-500">
              {timeFormat.format(new Date(duty.startAt))} —{" "}
              {timeFormat.format(new Date(duty.endAt))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
