import { NavLink } from "react-router-dom";
import { LogoIcon, RouteIcon, TruckIcon } from "./icons";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-lime-400/10 text-lime-300"
      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
  ].join(" ");

export function Sidebar() {
  return (
    <header className="border-b border-zinc-800/70 bg-zinc-950 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3 md:h-full md:flex-col md:items-stretch md:justify-start md:gap-8 md:px-5 md:py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-lime-400 text-zinc-950">
            <LogoIcon />
          </span>
          <div className="leading-tight">
            <span className="font-display block text-base font-semibold tracking-tight">
              Lawawa
            </span>
            <span className="hidden text-[11px] text-zinc-500 md:block">
              Planificación de transporte
            </span>
          </div>
        </div>

        <nav className="flex gap-1 md:flex-col">
          <NavLink to="/routes" className={linkClass}>
            <RouteIcon />
            Rutas
          </NavLink>
          <NavLink to="/units" className={linkClass}>
            <TruckIcon />
            Unidades
          </NavLink>
        </nav>

        <p className="mt-auto hidden text-[11px] text-zinc-600 md:block">
          MVP · Prueba técnica WAWA
        </p>
      </div>
    </header>
  );
}
