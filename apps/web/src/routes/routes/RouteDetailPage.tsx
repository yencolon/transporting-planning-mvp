import type { DutyDto } from "@repo/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
} from "../../components/icons";
import { Empty, ErrorMessage, Loading } from "../../components/StatusMessage";
import { AssignDutyForm } from "../../components/AssignDutyForm";
import { RouteMap } from "../../components/RouteMap";
import { RoutePointsStrip } from "../../components/RoutePointsStrip";
import { useUnits } from "../units/hooks";
import { useDeleteDuty, useDeleteRoute, useRouteDetail } from "./hooks";

const timeFormat = new Intl.DateTimeFormat("es-DO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatWindow = (duty: DutyDto) =>
  `${timeFormat.format(new Date(duty.startAt))} — ${timeFormat.format(new Date(duty.endAt))}`;

export function RouteDetailPage() {
  const { id = "" } = useParams();
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
      navigate("/routes");
    }
  };

  return (
    <section className="grid gap-8">
      <header className="grid gap-4">
        <Link
          to="/routes"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition hover:text-lime-300"
        >
          <ArrowLeftIcon className="size-3.5" />
          Rutas
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {route.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {route.points.length} puntos · {route.duties.length}{" "}
              {route.duties.length === 1 ? "duty" : "duties"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/routes/${route.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              <PencilIcon className="size-3.5" />
              Editar
            </Link>
            <button
              type="button"
              onClick={removeRoute}
              disabled={deleteRoute.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <TrashIcon className="size-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </header>

      {deleteRoute.error && <ErrorMessage error={deleteRoute.error} />}

      <RouteMap points={route.points} />

      <div className="grid gap-8">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Puntos
          </h2>
          <RoutePointsStrip points={route.points} />
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Duties
          </h2>

          {route.duties.length === 0 ? (
            <Empty>Esta ruta no tiene duties asignados.</Empty>
          ) : (
            <ul className="grid gap-2" data-testid="route-duties">
              {route.duties.map((duty) => (
                <li
                  key={duty.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-400">
                      <TruckIcon />
                    </span>
                    <div>
                      <span className="block text-sm font-medium">
                        {unitName(duty.unitId)}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {formatWindow(duty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDuty.mutate(duty.id)}
                    disabled={deleteDuty.isPending}
                    aria-label="Quitar duty"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {deleteDuty.error && (
            <div className="mt-2">
              <ErrorMessage error={deleteDuty.error} />
            </div>
          )}

          <AssignDutyForm routeId={route.id} />
        </section>
      </div>
    </section>
  );
}
