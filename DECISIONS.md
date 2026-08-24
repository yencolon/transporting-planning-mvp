# Bitácora de decisiones

## Decisiones arquitectónicas y de diseño

**1)** Decidí usar un monorepo por practicidad, de tal manera que tengo todo el
código y a la IA trabajando sobre el mismo proyecto en todo momento. El efecto
secundario que más me sirvió: el contrato vive en un solo sitio (`@repo/shared`),
así que un cambio incompatible entre API y frontend rompe la compilación en vez
de aparecer en runtime.

**2)** En cuanto a arquitectura, elegí implementar una arquitectura hexagonal (a
menor escala), de tal forma que tengo las responsabilidades de dominio,
aplicación e infraestructura separadas y no dependientes unas de otras. Las
dependencias apuntan hacia dentro: el dominio no conoce ni Nest ni Prisma.

**3)** Elegí Postgres en lugar de Mongo porque el corazón del ejercicio es que
una unidad no tenga dos duties solapados, y eso es una restricción de integridad
sobre rangos de tiempo. Postgres la declara y la impone él mismo en cada insert:

```sql
EXCLUDE USING gist ("unitId" WITH =, tsrange("startAt", "endAt", '[)') WITH &&)
```

En Mongo no hay equivalente nativo: un índice único compara valores iguales, no
intersección de rangos. Tendría que resolverlo a mano con transacciones o
bloqueos, justo en el punto donde fallar en silencio significa mandar dos veces
el mismo autobús. A cambio asumo menos flexibilidad de esquema y una migración
por cada cambio de modelo, algo barato en un dominio tan estable.

**4)** Adicionalmente, implementé un poco de TDD para crear las features, de tal
forma que el flujo fue test (casos de uso críticos) → implementación. Sacó
defectos reales: un `execute` no-async cuya validación lanzaba de forma síncrona,
y tests que tomaban filas ajenas como fixtures y fallaban de forma intermitente
al correr en paralelo.

**5)** El conflicto no bloquea el envío. El timeline pinta el solapamiento en
rojo, pero el botón sigue activo y el error solo aparece cuando el servidor lo
rechaza: quien decide es el servidor, no el cliente, y así la regla se puede
provocar en lugar de esconderse tras un botón deshabilitado.

**6)** La concurrencia se demuestra con un script (`pnpm race`) y no con un botón
en la interfaz. Una UI que existe solo para demostrar no le sirve a ningún
usuario.

En cuanto a las decisiones que tomé yo y las que tomó la IA, fueron las
siguientes.

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
