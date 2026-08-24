/**
 * Fires N simultaneous duty assignments for the same unit and overlapping
 * windows, then checks how many actually landed.
 *
 * The application layer checks for overlap before writing, but between that
 * check and the INSERT another request can slip in. What holds the line is the
 * EXCLUDE constraint in Postgres. Run with the API up:
 *
 *   pnpm race                          # 5 peticiones contra localhost:3000
 *   pnpm race 20                       # 20 peticiones
 *   pnpm race 20 https://mi-api.com    # contra un despliegue
 *
 * Los argumentos van por forma, no por posición, para no depender de la
 * sintaxis de variables de entorno de cada shell (`VAR=x cmd` no existe en
 * PowerShell). API_URL sigue funcionando si prefieres el entorno.
 */
const args = process.argv.slice(2);
const ATTEMPTS = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 5);
const BASE_URL =
  args.find((arg) => /^https?:\/\//.test(arg)) ??
  process.env.API_URL ??
  'http://localhost:3000';

const stamp = Date.now();

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload =
    response.status === 204 ? undefined : await response.json().catch(() => undefined);

  return { status: response.status, payload };
}

async function main() {
  const health = await fetch(`${BASE_URL}/routes`).catch(() => undefined);
  if (!health?.ok) {
    console.error(
      `No hay API en ${BASE_URL}. Levantala con: pnpm --filter=api dev`,
    );
    process.exit(1);
  }

  const route = await call('POST', '/routes', {
    name: `race-${stamp}`,
    points: [{ lat: 18.4861, lng: -69.9312 }],
  });
  const unit = await call('POST', '/units', { name: `RACE-${stamp}` });

  const routeId = route.payload.data.id;
  const unitId = unit.payload.data.id;

  // Every window contains 07:00, so no two of them can coexist.
  const windows = Array.from({ length: ATTEMPTS }, (_, index) => ({
    routeId,
    unitId,
    startAt: new Date(Date.UTC(2029, 0, 1, 6, index)).toISOString(),
    endAt: new Date(Date.UTC(2029, 0, 1, 8)).toISOString(),
  }));

  console.log(
    `\n${ATTEMPTS} peticiones simultaneas · ${BASE_URL} · ventanas que se solapan todas\n`,
  );

  const results = await Promise.all(
    windows.map((body) => call('POST', '/duties', body)),
  );

  const created = results.filter((r) => r.status === 201);
  const rejected = results.filter((r) => r.status !== 201);
  const codes = new Set(rejected.map((r) => r.payload?.error?.code));

  console.log(`  creadas    ${created.length}`);
  console.log(
    `  rechazadas ${rejected.length}${codes.size ? `  (${[...codes].join(', ')})` : ''}`,
  );

  const stored = await call('GET', `/duties?unitId=${unitId}`);
  const rows = stored.payload.data.length;
  console.log(`  filas en la base de datos: ${rows}`);

  const ok = rows === 1 && created.length === 1;
  console.log(
    ok
      ? '\n  OK · la integridad se sostuvo bajo concurrencia\n'
      : `\n  FALLO · se esperaba 1 duty, hay ${rows}\n`,
  );

  for (const duty of stored.payload.data) {
    await call('DELETE', `/duties/${duty.id}`);
  }
  await call('DELETE', `/routes/${routeId}`);
  await call('DELETE', `/units/${unitId}`);

  process.exitCode = ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
