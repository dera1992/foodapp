import { ReactNode } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

export function TableCard({
  title,
  subtitle,
  actionLabel,
  actionHref,
  className,
  children
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="text-sm font-semibold text-brand-primaryDark hover:text-brand-primary">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {subtitle ? <p className="mt-1 text-sm text-brand-muted">{subtitle}</p> : null}
      <div className="mt-4 overflow-x-auto">{children}</div>
    </Card>
  );
}
