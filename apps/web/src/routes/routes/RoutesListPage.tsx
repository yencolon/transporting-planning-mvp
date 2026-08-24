import { Link } from "react-router-dom";
import { ChevronRightIcon, PlusIcon, RouteIcon } from "../../components/icons";
import { Empty, ErrorMessage, Loading } from "../../components/StatusMessage";
import { useRoutes } from "../../queries/routes";

export function RoutesListPage() {
  const { data: routes, isPending, error } = useRoutes();

  if (isPending) {
    return <Loading label="Cargando rutas…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <section className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">
            Operación
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
            Rutas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {routes.length} {routes.length === 1 ? "ruta" : "rutas"}{" "}
            planificadas
          </p>
        </div>
        <Link
          to="/routes/new"
          className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300"
        >
          <PlusIcon />
          Nueva ruta
        </Link>
      </header>

      {routes.length === 0 ? (
        <Empty>Todavía no hay rutas.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {routes.map((route) => (
            <li key={route.id}>
              <Link
                to={`/routes/${route.id}`}
                className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-zinc-800 text-zinc-400 transition group-hover:bg-lime-400/10 group-hover:text-lime-300">
                    <RouteIcon className="size-4.5" />
                  </span>
                  <ChevronRightIcon className="size-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-lime-300" />
                </div>
                <h2 className="mt-4 font-medium">{route.name}</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {route.pointCount} puntos
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
