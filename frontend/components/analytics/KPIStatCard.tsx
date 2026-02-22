import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

type KPIStatRow = { label: string; value: string };

export function KPIStatCard({
  label,
  value,
  icon,
  rows,
  accentClassName,
  iconClassName,
  delayClassName
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  rows?: KPIStatRow[];
  accentClassName?: string;
  iconClassName?: string;
  delayClassName?: string;
}) {
  return (
    <Card className={cn('bf-analytics-stat-card p-6', delayClassName, accentClassName)}>
      <div className={cn('bf-analytics-stat-icon', iconClassName)}>{icon}</div>
      <p className="bf-analytics-stat-label">{label}</p>
      <p className="bf-analytics-stat-value">{value}</p>
      {rows?.length ? (
        <div className="mt-2 space-y-1">
          {rows.map((row) => (
            <div key={row.label} className="bf-analytics-stat-row">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      <div className="bf-analytics-stat-orb" aria-hidden="true" />
    </Card>
  );
}
