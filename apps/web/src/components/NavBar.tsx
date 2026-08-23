import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-200/70',
  ].join(' ');

export function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-5 py-3">
        <span className="text-sm font-semibold tracking-tight">Lawawa</span>
        <nav className="flex gap-1">
          <NavLink to="/routes" className={linkClass}>
            Rutas
          </NavLink>
          <NavLink to="/units" className={linkClass}>
            Unidades
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
