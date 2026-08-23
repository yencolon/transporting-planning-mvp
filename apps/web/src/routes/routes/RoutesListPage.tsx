import { Link } from 'react-router-dom';
import { Empty, ErrorMessage, Loading } from '../../components/StatusMessage';
import { useRoutes } from './hooks';

export function RoutesListPage() {
  const { data: routes, isPending, error } = useRoutes();

  if (isPending) {
    return <Loading label="Cargando rutas…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rutas</h1>
          <span className="text-sm text-slate-500">
            {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}
          </span>
        </div>
        <Link
          to="/routes/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Nueva ruta
        </Link>
      </header>

      {routes.length === 0 ? (
        <Empty>Todavía no hay rutas.</Empty>
      ) : (
        <ul className="grid gap-2">
          {routes.map((route) => (
            <li key={route.id}>
              <Link
                to={`/routes/${route.id}`}
                className="flex items-baseline justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-500 hover:bg-blue-50/40"
              >
                <span className="font-medium">{route.name}</span>
                <span className="text-sm text-slate-500">
                  {route.pointCount} puntos
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
