# Bitácora de decisiones

## Por qué PostgreSQL y no MongoDB

El corazón del ejercicio no es guardar duties: es garantizar que **una unidad
nunca tenga dos ventanas solapadas**, incluso con peticiones simultáneas. Eso es
una restricción de integridad sobre rangos de tiempo, y Postgres la expresa de
forma declarativa:

```sql
EXCLUDE USING gist ("unitId" WITH =, tsrange("startAt", "endAt", '[)') WITH &&)
```

El motor la impone en cada `INSERT`. No hay ventana entre comprobar y escribir,
porque la comprobación _es_ la escritura.

En MongoDB no existe equivalente: un índice único compara valores iguales, no
intersección de rangos. Para sostener lo mismo habría que envolver cada
asignación en una transacción con lectura previa y confiar en reintentos, o
montar un esquema de bloqueo por unidad. Es decir, **implementar a mano lo que
Postgres ya da**, en el único punto del sistema donde un fallo silencioso
significa mandar dos veces el mismo autobús.

A eso se suma que el dominio es relacional de forma natural: una ruta tiene
puntos ordenados, un duty referencia una ruta y una unidad, y las claves foráneas
con `RESTRICT` impiden borrar algo que todavía se usa.

**Lo que asumo a cambio:** menos flexibilidad de esquema y una migración por cada
cambio de modelo. En un MVP con un dominio tan estable, me pareció barato.

## Decisiones de arquitectura que tomé yo

- **Monorepo con Turborepo y pnpm.** Es la primera decisión del proyecto y
  condiciona el resto: API, frontend y un paquete `@repo/shared` en un solo
  repositorio. Lo que gano es que el contrato vive en un único sitio —los
  esquemas Zod validan en la API y tipan los formularios, y las clases de
  respuesta de Swagger implementan esas mismas interfaces—, así que un cambio
  incompatible **rompe la compilación en vez de llegar al runtime**. Para quien
  revisa, además, es un clone y un `pnpm install`.
- **Un único envelope para toda respuesta**: `{ data }` en éxito,
  `{ error: { code, message, issues? } }` en fallo. La IA recomendó lo contrario
  (cuerpos REST desnudos, unificando solo los errores). Lo rechacé: prefiero que
  el frontend parsee una sola forma en todos los casos. El detonante fue una
  auditoría que encontró **tres formas de error distintas** conviviendo.
- **`error.code` como contrato**, no el estado HTTP. `OverlappingDutyError` y
  `RouteHasDutiesError` son ambos 409 y significan cosas opuestas para el
  usuario.
- **Zod en lugar de class-validator**. Un esquema es a la vez validación y tipo,
  no arrastra decoradores ni `reflect-metadata`, y el mismo esquema vive en
  `@repo/shared` para API y formularios.
- **`src/routes/` refleja el árbol de URLs** en el frontend, y `src/api/` tiene un
  archivo por grupo de endpoints en lugar de un `endpoints.ts` único.
- **Sin tests de componentes en el frontend**. La lógica que importa —
  solapamiento, concurrencia, persistencia — está cubierta en la API. La UI se
  movía demasiado rápido para que tests de vista se pagaran solos.
- **El conflicto no bloquea el envío.** El timeline pinta el solapamiento en
  rojo, pero el botón sigue activo y el error solo aparece cuando el servidor lo
  rechaza. Quiero que la regla se pueda provocar, no esconder tras un botón
  deshabilitado: quien decide es el servidor, no el cliente.
- **Demostrar la concurrencia con un script** (`pnpm race`) y no con un botón en
  la interfaz. Una UI que existe solo para demostrar no le sirve a ningún
  usuario.
- **TDD a partir de la capa de aplicación.** Sacó defectos reales: un `execute`
  no-async cuya validación lanzaba de forma síncrona, y tests que tomaban filas
  ajenas como fixtures y fallaban de forma intermitente al correr en paralelo.

## Dónde acepté lo que propuso la IA

- **`startAt` + `endAt` explícitos** en lugar de inicio + duración. Convierte el
  solapamiento en un predicado indexable y el brief pedía fin explícito.
- **Doble aplicación de la regla**: chequeo en el caso de uso _y_ restricción en
  la base. El chequeo da un error explicable; la restricción cierra la carrera.
- **Ventanas semiabiertas**: un duty que acaba a las 08:00 y otro que empieza a
  las 08:00 no chocan.
- **Puertos como clases abstractas** en vez de interfaz más token de inyección:
  Nest usa la propia clase como token y desaparece el `@Inject` de cada caso de
  uso.
- **Un único `PersistenceModule`** que enlaza puertos con implementaciones. La
  propuesta inicial repartía ese enlace por módulo y creaba una dependencia
  circular (rutas necesitan duties, duties necesitan rutas).
- **Puntos de ruta como filas con `sequence`**, no como columna JSON: el orden lo
  garantiza la base.
- **Rechazar el borrado de una ruta o unidad con duties**, en vez de cascada. Un
  duty planificado no debería desaparecer como efecto secundario.

## Dónde la corregí o la frené

- Empezó a escribir DTOs con **class-validator**; lo cambié a Zod antes de que
  cuajara.
- Recomendó **no envolver las respuestas**; insistí en el envelope y lo
  implementó completo.
- Propuso un formulario que **avisaba del conflicto y teñía el botón de rojo**
  antes de enviar. Lo quité: adelantaba el veredicto del servidor.
- Escribió **CSS a mano** por componente; lo reemplacé por Tailwind.
- Tenía las carpetas de negocio al mismo nivel que la infraestructura y los
  archivos generados; las agrupé bajo `src/modules/`.
- Añadió un endpoint nuevo (`GET /duties?unitId=`) sin que quedara claro por qué
  tocaba el backend en una tarea de UI. Le pedí la justificación antes de
  seguir: el timeline necesita la agenda de la unidad, y hasta entonces los
  duties solo eran alcanzables por ruta.

## Lo que la IA hizo y verifiqué aparte

Todo lo que afirma esta bitácora sobre integridad está respaldado por tests que
corren contra Postgres real, no por la palabra del asistente: `pnpm race` y
`apps/api/test/duty-concurrency.e2e-spec.ts`.
