import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="bf-breadcrumb">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href && !isCurrent ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className={isCurrent ? 'current' : undefined}>{item.label}</span>
            )}
            {!isCurrent ? <span className="sep">&gt;</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
