import type { ApiErrorIssueDto } from '@repo/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Carries the API's `error.code`. Two failures can share a status — a 409 is
 * either OverlappingDutyError or RouteHasDutiesError — so the UI branches on
 * the code, never on the status.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly issues?: ApiErrorIssueDto[];

  constructor(
    code: string,
    message: string,
    status: number,
    issues?: ApiErrorIssueDto[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.issues = issues;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => undefined);
  const error = (body as { error?: unknown } | undefined)?.error;

  if (isErrorBody(error)) {
    return new ApiError(error.code, error.message, response.status, error.issues);
  }

  return new ApiError(
    'UnknownError',
    `Request failed with status ${response.status}`,
    response.status,
  );
}

function isErrorBody(
  error: unknown,
): error is { code: string; message: string; issues?: ApiErrorIssueDto[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}
