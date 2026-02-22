import { ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primaryLight text-brand-primaryDark">
        {icon ?? <span aria-hidden="true">🛍️</span>}
      </div>
      <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{description}</p>
      {actionLabel && actionHref && (
        <a href={actionHref} className="mt-5 inline-block">
          <Button>{actionLabel}</Button>
        </a>
      )}
    </Card>
  );
}
