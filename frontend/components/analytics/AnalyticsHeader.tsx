import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function AnalyticsHeader({
  breadcrumbs,
  title,
  titleAccent,
  subtitle
}: {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  titleAccent: string;
  subtitle: string;
}) {
  return (
    <header className="space-y-5">
      <nav aria-label="Breadcrumb" className="bf-analytics-breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
              {crumb.href && !isLast ? <Link href={crumb.href}>{crumb.label}</Link> : <span className={isLast ? 'current' : undefined}>{crumb.label}</span>}
              {!isLast ? <span className="sep">›</span> : null}
            </span>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-text md:text-4xl">
            {title} <span className="text-brand-primaryDark italic">{titleAccent}</span>
          </h1>
          <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>
        </div>
        <button type="button" className="bf-analytics-range-pill">
          Last 30 days ▾
        </button>
      </div>
    </header>
  );
}
