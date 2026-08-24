# Lawawa · MVP de planificación de transporte

Rutas como listas ordenadas de puntos geográficos, y duties que combinan una
ruta, una unidad y una ventana horaria con fin explícito. La regla central es
que **una unidad no puede tener dos duties cuyas ventanas se solapen**, y esa
regla se sostiene incluso bajo peticiones concurrentes.

## Demo en vivo

- Aplicación: <https://web-gold-two-80.vercel.app/>
- API: <https://transporting-planning-mvp-api.vercel.app/>
- Documentación (Swagger): <https://transporting-planning-mvp-api.vercel.app/docs>

Sobre Vercel y Supabase. La primera petición puede tardar un par de segundos
por el arranque en frío de la función.

## Stack

| Capa          | Tecnología                                    |
| ------------- | --------------------------------------------- |
| Monorepo      | Turborepo + pnpm                              |
| Backend       | NestJS 10 · TypeScript                        |
| Base de datos | PostgreSQL 16 (Docker) · Prisma 7             |
| Frontend      | React 19 · Vite · Tailwind 4 · TanStack Query |
| Mapa          | react-leaflet + OpenStreetMap                 |
| Validación    | Zod, compartida entre API y frontend          |
| Tests         | Vitest                                        |

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

### Contra un Postgres gestionado (Supabase, Neon, RDS)

Docker es solo comodidad. Cambia `DATABASE_URL` en `apps/api/.env` y aplica el
esquema:

```bash
pnpm --filter=api exec prisma migrate deploy
pnpm --filter=api db:seed        # ojo: vacía las tablas antes de insertar
```

En Supabase usa la cadena del **Session pooler**, no la conexión directa: esta
última resuelve solo por IPv6 y suele dar `P1001` desde una red sin IPv6.

El único requisito real es que se pueda habilitar la extensión `btree_gist`, de
la que depende la restricción `EXCLUDE` que sostiene la regla bajo concurrencia.

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
pnpm race                             # 5 peticiones contra localhost:3000
pnpm race 20                          # 20 peticiones
pnpm race 20 https://tu-api.com       # contra un despliegue
```

El script crea una ruta y una unidad temporales, lanza N asignaciones a la vez
con ventanas que se solapan todas entre sí, y comprueba cuántas quedaron:

```
20 peticiones simultaneas · http://localhost:3000 · ventanas que se solapan todas

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

## Qué dejé fuera a propósito

- **Autenticación.** No hay multi-tenancy ni roles en el enunciado: todo el que
  entra planifica la misma flota. Meter login habría añadido sesiones, guards y
  una tabla de usuarios sin cambiar nada del problema que se está evaluando.
- **Tests de componentes en el frontend.** La lógica que puede romperse de
  verdad —solapamiento, concurrencia, persistencia— está cubierta en la API con
  93 tests. La interfaz cambió de forma varias veces; unos tests de vista se
  habrían reescrito enteros en cada pasada sin haber atrapado nada.
- **CRUD de duties completo en la interfaz.** La API sabe reprogramar
  (`PATCH /duties/:id`, probado y documentado), pero la UI solo asigna y borra.
  Preferí que el camino de asignar quedara sólido, con el timeline de conflictos,
  antes que tener tres operaciones a medias.
- **GraphQL.** El enunciado lo ofrecía como opcional. Con nueve endpoints y un
  solo consumidor no aporta nada frente a REST, y sí complica el contrato
  compartido que hoy verifica el compilador.
- **Un botón para probar la concurrencia.** Existe la comprobación, pero como
  script (`pnpm race`), no como interfaz. Una pantalla que solo sirve para
  demostrar no le sirve a ningún usuario.

## Qué haría con más tiempo

Por orden de lo que más valor daría al producto:

1. **Tiempo de traslado entre duties.** Hoy dos duties consecutivos son válidos
   si no se solapan, aunque uno termine a 40 km de donde empieza el siguiente.
   La regla realista es que tiene que caber el traslado entre el último punto de
   una ruta y el primero de la otra. Es la que más se parece a la operación de
   verdad, y además no cabe en la restricción `EXCLUDE`: esta sabe expresar "no
   se solapan", pero no "sepáralos según la distancia". Viviría en la capa de
   aplicación, o en un trigger si se quiere la misma garantía bajo concurrencia.
2. **Reprogramar duties desde la interfaz**, apoyándose en el endpoint que ya
   existe: arrastrar el bloque sobre el timeline sería la forma natural.
3. **Zonas horarias explícitas.** Ahora se guarda `timestamp` sin zona y la UI
   usa la del navegador. Funciona con una sola zona, pero la noche del cambio de
   horario de verano una hora se repite y la regla de solapamiento deja de
   significar lo que creemos.
4. **Paginación y filtrado.** `GET /routes` y `GET /duties?unitId=` devuelven
   todo sin límite; con una flota real hay que paginar, y buscar por nombre en
   rutas y unidades deja de ser un lujo.
5. **Mejor manejo de los puntos en el mapa**: reordenar arrastrando, ajustar el
   zoom a los límites de la ruta, agrupar los puntos cercanos y buscar una
   dirección para colocar un punto sin conocer sus coordenadas.
6. **Integración continua.** Hay 98 tests y nada que los ejecute al hacer push.
7. **Versión móvil.** La interfaz es responsive a grandes rasgos, pero el
   timeline y la tira de puntos están pensados para pantalla ancha.
8. **Autenticación**, en cuanto haya más de un operador y tenga sentido saber
   quién reasignó un duty.
