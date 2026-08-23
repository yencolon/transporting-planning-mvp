import type { DutyDto } from '@repo/shared';
import { Link, useParams } from 'react-router-dom';
import { Empty, ErrorMessage, Loading } from '../../components/StatusMessage';
import { RouteMap } from './RouteMap';
import { useRouteDetail, useUnits } from './hooks';

const timeFormat = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatWindow = (duty: DutyDto) =>
  `${timeFormat.format(new Date(duty.startAt))} — ${timeFormat.format(new Date(duty.endAt))}`;

export function RouteDetailPage() {
  const { id = '' } = useParams();
  const { data: route, isPending, error } = useRouteDetail(id);
  const { data: units } = useUnits();

  if (isPending) {
    return <Loading label="Cargando ruta…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const unitName = (unitId: string) =>
    units?.find((unit) => unit.id === unitId)?.name ?? unitId;

  return (
    <section>
      <header className="mb-6">
        <Link
          to="/routes"
          className="text-sm text-slate-500 transition hover:text-blue-600"
        >
          ← Rutas
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {route.name}
        </h1>
      </header>

      <RouteMap points={route.points} />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Puntos
          </h2>
          <ol className="grid gap-2" data-testid="route-points">
            {route.points.map((point) => (
              <li
                key={point.sequence}
                className="flex items-baseline gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="w-5 shrink-0 text-xs tabular-nums text-slate-400">
                  {point.sequence + 1}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {point.name ?? 'Sin nombre'}
                </span>
                <span className="text-xs tabular-nums text-slate-500">
                  {point.lat}, {point.lng}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Duties
          </h2>
          {route.duties.length === 0 ? (
            <Empty>Esta ruta no tiene duties asignados.</Empty>
          ) : (
            <ul className="grid gap-2" data-testid="route-duties">
              {route.duties.map((duty) => (
                <li
                  key={duty.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {unitName(duty.unitId)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatWindow(duty)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
