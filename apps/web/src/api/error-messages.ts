import { ApiError } from './client';

/**
 * Two failures can share a status code, so the copy is keyed on `error.code`.
 * A 409 is either a busy unit or a route that still has duties.
 */
const COPY: Record<string, string> = {
  OverlappingDutyError: 'Esa unidad ya tiene un duty que se solapa con ese horario.',
  RouteHasDutiesError:
    'No se puede eliminar la ruta: todavía tiene duties asignados.',
  InvalidTimeWindowError: 'El fin del duty debe ser posterior al inicio.',
  RouteNotFoundError: 'La ruta ya no existe.',
  DutyNotFoundError: 'El duty ya no existe.',
  UnitNotFoundError: 'La unidad seleccionada ya no existe.',
  DuplicateUnitError: 'Ya existe una unidad con ese nombre.',
  UnitHasDutiesError:
    'No se puede eliminar la unidad: todavía tiene duties asignados.',
};

export function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Algo salió mal.';
  }

  if (error.code === 'ValidationError' && error.issues?.length) {
    return error.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join(' · ');
  }

  return COPY[error.code] ?? error.message;
}
