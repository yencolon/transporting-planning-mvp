import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';

function mockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('unwraps the data envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(200, { data: [{ id: 'r1' }] })),
    );

    await expect(apiRequest('/routes')).resolves.toEqual([{ id: 'r1' }]);
  });

  it('returns undefined for an empty 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('no body');
        },
      } as unknown as Response),
    );

    await expect(apiRequest('/duties/d1', { method: 'DELETE' })).resolves.toBe(
      undefined,
    );
  });

  it('throws an ApiError carrying the code so the UI can branch on it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse(409, {
          error: {
            code: 'OverlappingDutyError',
            message: 'Unit already busy.',
          },
        }),
      ),
    );

    const error = await apiRequest('/duties', { method: 'POST' }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('OverlappingDutyError');
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe('Unit already busy.');
  });

  it('keeps validation issues on the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse(400, {
          error: {
            code: 'ValidationError',
            message: 'Validation failed',
            issues: [{ path: 'name', message: 'Required' }],
          },
        }),
      ),
    );

    const error = (await apiRequest('/routes', { method: 'POST' }).catch(
      (e: unknown) => e,
    )) as ApiError;

    expect(error.issues).toEqual([{ path: 'name', message: 'Required' }]);
  });

  it('falls back when the body is not the expected error shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(500, 'gateway exploded')),
    );

    const error = (await apiRequest('/routes').catch(
      (e: unknown) => e,
    )) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('UnknownError');
    expect(error.status).toBe(500);
  });
});
