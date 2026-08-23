# Lawawa · MVP de planificación de transporte

Rutas como listas ordenadas de puntos geográficos, y duties que combinan una
ruta, una unidad y una ventana horaria con fin explícito. La regla central es
que **una unidad no puede tener dos duties cuyas ventanas se solapen**, y esa
regla se sostiene incluso bajo peticiones concurrentes.

## Stack

| Capa | Tecnología |
| --- | --- |
| Monorepo | Turborepo + pnpm |
| Backend | NestJS 10 · TypeScript |
| Base de datos | PostgreSQL 16 (Docker) · Prisma 7 |
| Frontend | React 19 · Vite · Tailwind 4 · TanStack Query |
| Mapa | react-leaflet + OpenStreetMap |
| Validación | Zod, compartida entre API y frontend |
| Tests | Vitest |

## Requisitos

- Node 22+
- pnpm 10
- Docker (para Postgres)

## Arranque local

```bash
pnpm install

# 1. Base de datos
pnpm db:up                          # Postgres en localhost:5432

# 2. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Esquema y datos de ejemplo
pnpm --filter=api db:migrate        # aplica migraciones y regenera el cliente
pnpm --filter=api db:seed           # 2 rutas, 2 unidades, 3 duties

# 4. Levantar todo
pnpm dev                            # API en :3000, web en :5173
```

- Aplicación: <http://localhost:5173>
- Documentación de la API (Swagger): <http://localhost:3000/docs>

`pnpm db:down` para el contenedor. `pnpm --filter=api db:studio` abre Prisma
Studio si quieres inspeccionar los datos.

## Verificar la regla de solapamiento

La regla se aplica en dos sitios, y los dos importan:

1. **Capa de aplicación** — `AssignDuty` consulta si la unidad ya tiene un duty
   que se cruce y lanza `OverlappingDutyError`. Da un error limpio y explicable.
2. **Base de datos** — una restricción `EXCLUDE USING gist` sobre
   `(unitId, tsrange(startAt, endAt, '[)'))`. Entre el chequeo del paso 1 y el
   `INSERT` cabe otra petición; esto es lo que cierra esa ventana.

Las ventanas son **semiabiertas**: un duty que termina a las 08:00 y otro que
empieza a las 08:00 no se solapan. La misma definición está en
`TimeWindow.overlaps`, en el predicado SQL y en la restricción.

### Bajo concurrencia

Con la API levantada:

```bash
pnpm race        # 5 peticiones simultáneas
pnpm race 20     # 20 peticiones simultáneas
```

El script crea una ruta y una unidad temporales, lanza N asignaciones a la vez
con ventanas que se solapan todas entre sí, y comprueba cuántas quedaron:

```
20 peticiones simultaneas · unidad RACE-… · ventanas que se solapan todas

  creadas    1
  rechazadas 19  (OverlappingDutyError)
  filas en la base de datos: 1

  OK · la integridad se sostuvo bajo concurrencia
```

Limpia lo que crea al terminar.

### Desde la interfaz

En el detalle de una ruta, al elegir unidad y horario se dibuja la agenda de esa
unidad ese día. Los bloques que se cruzan con la ventana propuesta se pintan en
rojo. **El botón sigue habilitado**: el aviso es informativo y quien decide es
el servidor, así que se puede forzar el envío y ver el 409.

### Tests automatizados

```bash
pnpm test                      # toda la suite
pnpm --filter=api test         # casos de uso, con dobles en memoria
pnpm --filter=api test:e2e     # contra Postgres real (requiere pnpm db:up)
```

`apps/api/test/duty-concurrency.e2e-spec.ts` cubre el caso concurrente:
peticiones simultáneas idénticas, cinco ventanas mutuamente solapadas, y
ventanas contiguas que sí deben aceptarse.

## Estructura

```
apps/api           NestJS
  src/modules/     rutas, duties y unidades; cada una con domain, application e infrastructure
  src/infrastructure  Prisma, capa HTTP (envelope, filtro de errores, OpenAPI)
  prisma/          esquema, migraciones y seed
apps/web           React
  src/api/         cliente HTTP y un archivo por grupo de endpoints
  src/routes/      refleja el árbol de URLs; cada carpeta es un segmento
packages/shared    esquemas Zod y tipos de respuesta que comparten API y web
scripts/race.mjs   comprobación de concurrencia
```

La dirección de dependencias en el backend va hacia dentro: interfaz →
aplicación → dominio. El dominio no conoce Nest ni Prisma, y las
implementaciones se enlazan en un único `PersistenceModule`.

## Contrato de la API

Toda respuesta correcta va envuelta en `{ data }`; todo fallo en
`{ error: { code, message, issues? } }`.

`code` es lo que hay que mirar, no el estado HTTP: `OverlappingDutyError` y
`RouteHasDutiesError` son ambos 409 y significan cosas distintas.

```
GET    /routes            POST   /duties
POST   /routes            GET    /duties?unitId=&from=&to=
GET    /routes/:id        PATCH  /duties/:id
PATCH  /routes/:id        DELETE /duties/:id
DELETE /routes/:id
                          GET    /units
                          POST   /units
                          DELETE /units/:id
```
