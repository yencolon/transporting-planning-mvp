import type { RoutePointDto } from "@repo/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "../../components/icons";
import { ErrorMessage, Loading } from "../../components/StatusMessage";
import { RouteMap } from "../../components/RouteMap";
import {
  useCreateRoute,
  useRouteDetail,
  useUpdateRoute,
} from "../../queries/routes";

interface DraftPoint {
  id: number;
  lat: string;
  lng: string;
  name: string;
}

let nextDraftId = 0;

const newPoint = (lat = "", lng = ""): DraftPoint => ({
  id: nextDraftId++,
  lat,
  lng,
  name: "",
});

const toDraft = (point: RoutePointDto): DraftPoint => ({
  ...newPoint(String(point.lat), String(point.lng)),
  name: point.name ?? "",
});

/** Only fully filled coordinates are previewed on the map. */
const toPreview = (points: DraftPoint[]): RoutePointDto[] =>
  points
    .map((point, index) => ({
      sequence: index,
      lat: Number(point.lat),
      lng: Number(point.lng),
      name: point.name.trim() || null,
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    .filter((point) => point.lat !== 0 || point.lng !== 0);

export function RouteFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const existing = useRouteDetail(id ?? "");
  const create = useCreateRoute();
  const update = useUpdateRoute(id ?? "");
  const mutation = isEdit ? update : create;

  const [name, setName] = useState("");
  const [points, setPoints] = useState<DraftPoint[]>(() => [newPoint()]);

  useEffect(() => {
    if (isEdit && existing.data) {
      setName(existing.data.name);
      setPoints(
        existing.data.points.length
          ? existing.data.points.map(toDraft)
          : [newPoint()],
      );
    }
  }, [isEdit, existing.data]);

  if (isEdit && existing.isPending) {
    return <Loading label="Cargando ruta…" />;
  }

  if (isEdit && existing.error) {
    return <ErrorMessage error={existing.error} />;
  }

  const setPoint = (index: number, patch: Partial<DraftPoint>) =>
    setPoints((current) =>
      current.map((point, i) => (i === index ? { ...point, ...patch } : point)),
    );

  const removePoint = (index: number) =>
    setPoints((current) =>
      current.length === 1
        ? [newPoint()]
        : current.filter((_, i) => i !== index),
    );

  const addPoint = (lat = "", lng = "") =>
    setPoints((current) => [...current, newPoint(lat, lng)]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const body = {
      name,
      points: points
        .filter((point) => point.lat !== "" && point.lng !== "")
        .map((point) => ({
          lat: Number(point.lat),
          lng: Number(point.lng),
          ...(point.name.trim() ? { name: point.name.trim() } : {}),
        })),
    };

    const saved = await mutation.mutateAsync(body).catch(() => undefined);
    if (saved) {
      navigate(`/routes/${saved.id}`);
    }
  };

  return (
    <section className="grid gap-8">
      <header className="grid gap-4">
        <Link
          to={isEdit ? `/routes/${id}` : "/routes"}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition hover:text-lime-300"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {isEdit ? "Editar ruta" : "Nueva ruta"}
        </h1>
      </header>

      <form onSubmit={submit} className="grid gap-8">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Nombre
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Centro - Norte"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20"
          />
        </label>

        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Puntos
            </h2>
            <span className="text-xs text-zinc-500">
              Haz clic en el mapa para añadir un punto
            </span>
          </div>

          <RouteMap
            points={toPreview(points)}
            onPick={(lat, lng) => addPoint(lat.toFixed(6), lng.toFixed(6))}
          />

          <ul className="mt-3 grid gap-2">
            {points.map((point, index) => (
              <li
                key={point.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-zinc-700 bg-zinc-900 font-display text-[11px] font-semibold text-lime-300">
                  {index + 1}
                </span>
                <input
                  value={point.lat}
                  onChange={(event) =>
                    setPoint(index, { lat: event.target.value })
                  }
                  placeholder="Latitud"
                  inputMode="decimal"
                  className="w-32 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20"
                />
                <input
                  value={point.lng}
                  onChange={(event) =>
                    setPoint(index, { lng: event.target.value })
                  }
                  placeholder="Longitud"
                  inputMode="decimal"
                  className="w-32 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20"
                />
                <input
                  value={point.name}
                  onChange={(event) =>
                    setPoint(index, { name: event.target.value })
                  }
                  placeholder="Nombre (opcional)"
                  className="min-w-40 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20"
                />
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  aria-label="Quitar punto"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => addPoint()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3.5 py-2 text-sm text-zinc-400 transition hover:border-lime-400/50 hover:text-lime-300"
          >
            <PlusIcon className="size-3.5" />
            Añadir punto
          </button>
        </div>

        {mutation.error && <ErrorMessage error={mutation.error} />}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
          >
            {mutation.isPending ? "Guardando…" : "Guardar"}
          </button>
          <Link
            to={isEdit ? `/routes/${id}` : "/routes"}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
