import { useState } from "react";
import { PlusIcon, TrashIcon, TruckIcon } from "../../components/icons";
import { Empty, ErrorMessage, Loading } from "../../components/StatusMessage";
import { useCreateUnit, useDeleteUnit, useUnits } from "./hooks";

export function UnitsPage() {
  const { data: units, isPending, error } = useUnits();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const [name, setName] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const created = await createUnit.mutateAsync(name).catch(() => undefined);
    if (created) {
      setName("");
    }
  };

  if (isPending) {
    return <Loading label="Cargando unidades…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <section className="grid gap-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">
          Flota
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Unidades
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {units.length} {units.length === 1 ? "unidad" : "unidades"}{" "}
          registradas
        </p>
      </header>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="BUS-014"
            className="min-w-48 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20"
          />
          <button
            type="submit"
            disabled={!name.trim() || createUnit.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
          >
            <PlusIcon className="size-3.5" />
            {createUnit.isPending ? "Creando…" : "Añadir unidad"}
          </button>
        </div>

        {createUnit.error && <ErrorMessage error={createUnit.error} />}
      </form>

      {units.length === 0 ? (
        <Empty>Todavía no hay unidades.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3.5"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-zinc-800 text-zinc-400">
                  <TruckIcon />
                </span>
                <span className="font-medium">{unit.name}</span>
              </span>
              <button
                type="button"
                onClick={() => deleteUnit.mutate(unit.id)}
                disabled={deleteUnit.isPending}
                aria-label="Eliminar unidad"
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
              >
                <TrashIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {deleteUnit.error && <ErrorMessage error={deleteUnit.error} />}
    </section>
  );
}
