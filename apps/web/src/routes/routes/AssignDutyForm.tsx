import { useState } from 'react';
import { messageFor } from '../../api/error-messages';
import { useAssignDuty, useUnits } from './hooks';

/** datetime-local gives a local wall-clock string; the API wants an instant. */
const toIso = (local: string) => new Date(local).toISOString();

export function AssignDutyForm({ routeId }: { routeId: string }) {
  const { data: units } = useUnits();
  const assign = useAssignDuty();

  const [unitId, setUnitId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

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

  const ready = unitId && startAt && endAt;

  return (
    <form
      onSubmit={submit}
      className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-white p-3"
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
            onChange={(event) => setStartAt(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Fin</span>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>

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
