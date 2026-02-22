import { cn } from '@/lib/utils/cn';

export function ProgressMetricRow({
  label,
  value,
  percent,
  colorClassName
}: {
  label: string;
  value: string;
  percent: number;
  colorClassName?: string;
}) {
  return (
    <div className="bf-analytics-list-row">
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-text">{label}</p>
          <p className="font-serif text-base font-bold text-brand-primaryDark">{value}</p>
        </div>
        <div className="bf-analytics-progress-track">
          <div className={cn('bf-analytics-progress-fill', colorClassName)} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
        </div>
      </div>
    </div>
  );
}
