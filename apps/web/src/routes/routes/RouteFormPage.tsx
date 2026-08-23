import type { RoutePointDto } from '@repo/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { messageFor } from '../../api/error-messages';
import { ErrorMessage, Loading } from '../../components/StatusMessage';
import { RouteMap } from './RouteMap';
import { useCreateRoute, useRouteDetail, useUpdateRoute } from './hooks';

interface DraftPoint {
  lat: string;
  lng: string;
  name: string;
}

const emptyPoint: DraftPoint = { lat: '', lng: '', name: '' };

const toDraft = (point: RoutePointDto): DraftPoint => ({
  lat: String(point.lat),
  lng: String(point.lng),
  name: point.name ?? '',
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

  const existing = useRouteDetail(id ?? '');
  const create = useCreateRoute();
  const update = useUpdateRoute(id ?? '');
  const mutation = isEdit ? update : create;

  const [name, setName] = useState('');
  const [points, setPoints] = useState<DraftPoint[]>([emptyPoint]);

  useEffect(() => {
    if (isEdit && existing.data) {
      setName(existing.data.name);
      setPoints(
        existing.data.points.length
          ? existing.data.points.map(toDraft)
          : [emptyPoint],
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
    setPoints((current) => current.filter((_, i) => i !== index));

  const addPoint = (lat = '', lng = '') =>
    setPoints((current) => [...current, { lat, lng, name: '' }]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const body = {
      name,
      points: points
        .filter((point) => point.lat !== '' && point.lng !== '')
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
    <section>
      <header className="mb-6">
        <Link
          to={isEdit ? `/routes/${id}` : '/routes'}
          className="text-sm text-slate-500 transition hover:text-blue-600"
        >
          ← Volver
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {isEdit ? 'Editar ruta' : 'Nueva ruta'}
        </h1>
      </header>

      <form onSubmit={submit} className="grid gap-6">
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nombre
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Centro - Norte"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Puntos
            </h2>
            <span className="text-xs text-slate-400">
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
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="w-5 shrink-0 text-xs tabular-nums text-slate-400">
                  {index + 1}
                </span>
                <input
                  value={point.lat}
                  onChange={(event) =>
                    setPoint(index, { lat: event.target.value })
                  }
                  placeholder="Latitud"
                  inputMode="decimal"
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                />
                <input
                  value={point.lng}
                  onChange={(event) =>
                    setPoint(index, { lng: event.target.value })
                  }
                  placeholder="Longitud"
                  inputMode="decimal"
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                />
                <input
                  value={point.name}
                  onChange={(event) =>
                    setPoint(index, { name: event.target.value })
                  }
                  placeholder="Nombre (opcional)"
                  className="min-w-40 flex-1 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  disabled={points.length === 1}
                  className="rounded px-2 py-1 text-sm text-slate-400 transition hover:text-red-600 disabled:opacity-40 disabled:hover:text-slate-400"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => addPoint()}
            className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
          >
            + Añadir punto
          </button>
        </div>

        {mutation.error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {messageFor(mutation.error)}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
          <Link
            to={isEdit ? `/routes/${id}` : '/routes'}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
