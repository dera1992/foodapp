import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full bg-brand-primaryLight px-3 py-1 text-xs font-semibold text-brand-primaryDark', className)}
      {...props}
    />
  );
}
