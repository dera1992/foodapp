import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-border bg-brand-surface shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-cardHover',
        className
      )}
      {...props}
    />
  );
}
