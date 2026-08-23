import { useState } from 'react';
import { messageFor } from '../../api/error-messages';
import { useUnits } from '../units/hooks';
import { UnitDayTimeline, overlaps, toBlock } from './UnitDayTimeline';
import type { Block } from './UnitDayTimeline';
import { useAssignDuty, useRoutes, useUnitDuties } from './hooks';

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

  const [unitId, setUnitId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const bounds = startAt ? dayBounds(startAt) : undefined;
  const { data: unitDuties } = useUnitDuties(
    unitId,
    bounds?.from,
    bounds?.to,
  );

  const routeName = (id: string) =>
    routes?.find((route) => route.id === id)?.name ?? 'Ruta';

  const existing: Block[] = (unitDuties ?? []).map((duty) =>
    toBlock(duty, routeName(duty.routeId)),
  );

  const draft: Block | undefined = isComplete(startAt, endAt)
    ? { startAt: toIso(startAt), endAt: toIso(endAt), label: 'Nuevo' }
    : undefined;

  const conflicts = draft
    ? existing.filter((duty) => overlaps(duty, draft))
    : [];

  const changeStart = (value: string) => {
    setStartAt(value);
    // Keep the window coherent: an end before the new start makes no sense.
    if (endAt && new Date(endAt) <= new Date(value)) {
      setEndAt('');
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
      setStartAt('');
      setEndAt('');
    }
  };

  const ready = unitId && isComplete(startAt, endAt);

  return (
    <form
      onSubmit={submit}
      className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <select
        value={unitId}
        onChange={(event) => setUnitId(event.target.value)}
        className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Selecciona una unidad…</option>
        {units?.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Inicio</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => changeStart(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Fin</span>
          <input
            type="datetime-local"
            value={endAt}
            min={startAt || undefined}
            disabled={!startAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
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

      {assign.error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {messageFor(assign.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || assign.isPending}
        className="justify-self-start rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {assign.isPending ? 'Asignando…' : 'Asignar duty'}
      </button>
    </form>
  );
}
