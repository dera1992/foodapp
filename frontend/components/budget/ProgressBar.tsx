export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
