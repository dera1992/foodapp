import { cn } from '@/lib/utils/cn';

export function StatusPill({ status }: { status: 'completed' | 'pending' | 'cancelled' }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold',
        status === 'completed' && 'bg-emerald-100 text-emerald-800',
        status === 'pending' && 'bg-amber-100 text-amber-800',
        status === 'cancelled' && 'bg-red-100 text-red-800'
      )}
    >
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
