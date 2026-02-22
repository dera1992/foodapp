import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        className
      )}
      {...props}
    />
  );
}
