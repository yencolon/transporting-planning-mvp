import { useState } from 'react';
import { messageFor } from '../../api/error-messages';
import { Empty, ErrorMessage, Loading } from '../../components/StatusMessage';
import { useCreateUnit, useDeleteUnit, useUnits } from './hooks';

export function UnitsPage() {
  const { data: units, isPending, error } = useUnits();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const [name, setName] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const created = await createUnit.mutateAsync(name).catch(() => undefined);
    if (created) {
      setName('');
    }
  };

  if (isPending) {
    return <Loading label="Cargando unidades…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
        <span className="text-sm text-slate-500">
          {units.length} {units.length === 1 ? 'unidad' : 'unidades'}
        </span>
      </header>

      <form onSubmit={submit} className="mb-6 grid gap-2">
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="BUS-014"
            className="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!name.trim() || createUnit.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {createUnit.isPending ? 'Creando…' : 'Añadir unidad'}
          </button>
        </div>

        {createUnit.error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {messageFor(createUnit.error)}
          </p>
        )}
      </form>

      {units.length === 0 ? (
        <Empty>Todavía no hay unidades.</Empty>
      ) : (
        <ul className="grid gap-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <span className="font-medium">{unit.name}</span>
              <button
                type="button"
                onClick={() => deleteUnit.mutate(unit.id)}
                disabled={deleteUnit.isPending}
                className="rounded px-2 py-1 text-sm text-slate-400 transition hover:text-red-600 disabled:opacity-40"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {deleteUnit.error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {messageFor(deleteUnit.error)}
        </p>
      )}
    </section>
  );
}
