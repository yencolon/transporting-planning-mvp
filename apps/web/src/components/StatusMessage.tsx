import { messageFor } from "../api/error-messages";
import { WarningIcon } from "./icons";

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      <WarningIcon className="mt-0.5 size-4 shrink-0" />
      <p>{messageFor(error)}</p>
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 text-sm text-zinc-400"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400" />
      {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}
