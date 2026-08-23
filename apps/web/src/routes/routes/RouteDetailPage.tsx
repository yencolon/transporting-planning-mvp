import type { DutyDto } from '@repo/shared';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { messageFor } from '../../api/error-messages';
import { Empty, ErrorMessage, Loading } from '../../components/StatusMessage';
import { useUnits } from '../units/hooks';
import { AssignDutyForm } from './AssignDutyForm';
import { RouteMap } from './RouteMap';
import { useDeleteDuty, useDeleteRoute, useRouteDetail } from './hooks';

const timeFormat = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatWindow = (duty: DutyDto) =>
  `${timeFormat.format(new Date(duty.startAt))} — ${timeFormat.format(new Date(duty.endAt))}`;

export function RouteDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: route, isPending, error } = useRouteDetail(id);
  const { data: units } = useUnits();
  const deleteRoute = useDeleteRoute();
  const deleteDuty = useDeleteDuty(id);

  if (isPending) {
    return <Loading label="Cargando ruta…" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const unitName = (unitId: string) =>
    units?.find((unit) => unit.id === unitId)?.name ?? unitId;

  const removeRoute = async () => {
    const deleted = await deleteRoute
      .mutateAsync(route.id)
      .then(() => true)
      .catch(() => false);

    if (deleted) {
      navigate('/routes');
    }
  };

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/routes"
            className="text-sm text-slate-500 transition hover:text-blue-600"
          >
            ← Rutas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {route.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/routes/${route.id}/edit`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={removeRoute}
            disabled={deleteRoute.isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </header>

      {deleteRoute.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {messageFor(deleteRoute.error)}
        </p>
      )}

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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {unitName(duty.unitId)}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {formatWindow(duty)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDuty.mutate(duty.id)}
                    disabled={deleteDuty.isPending}
                    className="rounded px-2 py-1 text-xs text-slate-400 transition hover:text-red-600 disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {deleteDuty.error && (
            <p
              role="alert"
              className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {messageFor(deleteDuty.error)}
            </p>
          )}

          <AssignDutyForm routeId={route.id} />
        </section>
      </div>
    </section>
  );
}
