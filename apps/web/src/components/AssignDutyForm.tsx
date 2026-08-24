import { useState } from "react";
import { useUnits } from "../routes/units/hooks";
import { ErrorMessage } from "./StatusMessage";
import { UnitDayTimeline, overlaps, toBlock } from "./UnitDayTimeline";
import type { Block } from "./UnitDayTimeline";
import {
  useAssignDuty,
  useRoutes,
  useUnitDuties,
} from "../routes/routes/hooks";

/** datetime-local gives a local wall-clock string; the API wants an instant. */
const toIso = (local: string) => new Date(local).toISOString();

const isComplete = (start: string, end: string) =>
  Boolean(start && end) && new Date(end) > new Date(start);

function dayBounds(local: string) {
  const start = new Date(local);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString(), dayStart: start };
}

export function AssignDutyForm({ routeId }: { routeId: string }) {
  const { data: units } = useUnits();
  const { data: routes } = useRoutes();
  const assign = useAssignDuty();

  const [unitId, setUnitId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const bounds = startAt ? dayBounds(startAt) : undefined;
  const { data: unitDuties } = useUnitDuties(unitId, bounds?.from, bounds?.to);

  const routeName = (id: string) =>
    routes?.find((route) => route.id === id)?.name ?? "Ruta";

  const existing: Block[] = (unitDuties ?? []).map((duty) =>
    toBlock(duty, routeName(duty.routeId)),
  );

  const draft: Block | undefined = isComplete(startAt, endAt)
    ? { startAt: toIso(startAt), endAt: toIso(endAt), label: "Nuevo" }
    : undefined;

  const conflicts = draft
    ? existing.filter((duty) => overlaps(duty, draft))
    : [];

  const changeStart = (value: string) => {
    setStartAt(value);
    // Keep the window coherent: an end before the new start makes no sense.
    if (endAt && new Date(endAt) <= new Date(value)) {
      setEndAt("");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const created = await assign
      .mutateAsync({
        routeId,
        unitId,
        startAt: toIso(startAt),
        endAt: toIso(endAt),
      })
      .catch(() => undefined);

    if (created) {
      setStartAt("");
      setEndAt("");
    }
  };

  const ready = unitId && isComplete(startAt, endAt);

  const fieldClass =
    "rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 disabled:bg-zinc-900/40 disabled:text-zinc-500";

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Asignar duty
      </h3>

      <select
        value={unitId}
        onChange={(event) => setUnitId(event.target.value)}
        className={fieldClass}
      >
        <option value="">Selecciona una unidad…</option>
        {units?.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs text-zinc-500">Inicio</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => changeStart(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs text-zinc-500">Fin</span>
          <input
            type="datetime-local"
            value={endAt}
            min={startAt || undefined}
            disabled={!startAt}
            onChange={(event) => setEndAt(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      {unitId && bounds && (
        <UnitDayTimeline
          dayStart={bounds.dayStart}
          duties={existing}
          draft={draft}
          conflicts={conflicts}
        />
      )}

      {assign.error && <ErrorMessage error={assign.error} />}

      <button
        type="submit"
        disabled={!ready || assign.isPending}
        className="justify-self-start rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
      >
        {assign.isPending ? "Asignando…" : "Asignar duty"}
      </button>
    </form>
  );
}
