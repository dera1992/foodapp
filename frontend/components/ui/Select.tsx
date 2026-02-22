import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-xl border border-brand-border bg-white px-4 text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        className
      )}
      {...props}
    />
  );
}
