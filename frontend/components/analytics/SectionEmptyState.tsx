import Link from 'next/link';

export function SectionEmptyState({
  emoji,
  title,
  description,
  actionLabel,
  actionHref
}: {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="bf-analytics-empty">
      <span className="text-4xl" aria-hidden="true">
        {emoji}
      </span>
      <h4 className="mt-3 text-lg font-semibold text-brand-text">{title}</h4>
      <p className="mt-1 text-sm text-brand-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-3 inline-flex text-sm font-semibold text-brand-primaryDark hover:text-brand-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
