import type { RoutePointDto } from "@repo/shared";

const PER_ROW = 8;

/**
 * Ordered points drawn as a subway line. Past PER_ROW stops the line wraps in an
 * S: even rows run left-to-right, odd rows right-to-left. Because the direction
 * alternates, each wrap starts on the same edge where the previous row ended, so
 * the two are joined by a C-shaped bridge on that edge.
 */
export function RoutePointsStrip({ points }: { points: RoutePointDto[] }) {
  const rows: RoutePointDto[][] = [];
  for (let i = 0; i < points.length; i += PER_ROW) {
    rows.push(points.slice(i, i + PER_ROW));
  }

  return (
    <ol className="grid w-full gap-y-3" data-testid="route-points">
      {rows.map((row, rowIndex) => {
        const reversed = rowIndex % 2 === 1;
        const stops = reversed ? [...row].reverse() : row;
        const lastRow = rowIndex === rows.length - 1;

        return (
          <li key={rowIndex} className="relative">
            {/* El padding reserva el ancho del puente: la línea termina justo
                donde arranca el arco. Debe coincidir con la w-* del puente. */}
            <ol className="flex w-full px-7">
              {stops.map((point, index) => {
                // The line only stops at the very start and the very end of the
                // whole route; inside, it runs edge to edge so the bridges connect.
                const routeStart = rowIndex === 0 && index === 0;
                const routeEnd = lastRow && index === stops.length - 1;

                return (
                  <li
                    key={point.sequence}
                    className="group relative flex min-w-14 flex-1 flex-col"
                  >
                    <span className="flex items-center">
                      <span
                        aria-hidden
                        className={`h-0.5 flex-1 ${routeStart ? "" : "bg-lime-400/60"}`}
                      />
                      <span
                        title={`${point.name ?? "Sin nombre"} · ${point.lat}, ${point.lng}`}
                        className={`grid size-6 shrink-0 cursor-default place-items-center rounded-full border-2 border-lime-400 font-display text-[10px] font-bold transition ${
                          routeStart
                            ? "bg-lime-400 text-zinc-950"
                            : "bg-zinc-950 text-lime-300 group-hover:bg-lime-400 group-hover:text-zinc-950"
                        } group-hover:scale-125`}
                      >
                        {point.sequence + 1}
                      </span>
                      <span
                        aria-hidden
                        className={`h-0.5 flex-1 ${routeEnd ? "" : "bg-lime-400/60"}`}
                      />
                    </span>
                    <span className="mt-1.5 self-center px-1 text-[10px] whitespace-nowrap text-zinc-400 transition group-hover:text-zinc-100">
                      {point.name ?? "Sin nombre"}
                    </span>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs whitespace-nowrap shadow-lg group-hover:block">
                      <span className="block font-medium text-zinc-100">
                        {point.name ?? "Sin nombre"}
                      </span>
                      <span className="block tabular-nums text-zinc-500">
                        {point.lat}, {point.lng}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {/*
              Bridge to the next row. Spans from this row's dot centre (top-3)
              down to the next one's: 100% of this row plus the 0.75rem gap.
            */}
            {!lastRow && (
              <span
                aria-hidden
                className={`pointer-events-none absolute top-3 h-[calc(100%+0.75rem)] w-7 border-y-2 border-lime-400/60 ${
                  reversed
                    ? "left-0 rounded-l-full border-l-2"
                    : "right-0 rounded-r-full border-r-2"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
