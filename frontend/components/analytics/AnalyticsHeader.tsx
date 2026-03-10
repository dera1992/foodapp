'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
  { label: 'All time', days: null },
];

export function AnalyticsHeader({
  breadcrumbs,
  title,
  titleAccent,
  subtitle,
  activeDays,
}: {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  titleAccent: string;
  subtitle: string;
  activeDays: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = RANGE_OPTIONS.find((o) => o.days === activeDays) ?? RANGE_OPTIONS[5];

  function pick(days: number | null) {
    setOpen(false);
    const url = days ? `${pathname}?days=${days}` : pathname;
    router.push(url);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="space-y-5">
      <nav aria-label="Breadcrumb" className="bf-analytics-breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
              {crumb.href && !isLast ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span className={isLast ? 'current' : undefined}>{crumb.label}</span>
              )}
              {!isLast ? <span className="sep">›</span> : null}
            </span>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 md:text-4xl">
            {title} <span className="italic" style={{ color: '#15803D' }}>{titleAccent}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        {/* Date range picker */}
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            {selected.label}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {RANGE_OPTIONS.map((opt) => {
                const isActive = opt.days === activeDays;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => pick(opt.days)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                    style={isActive ? { color: '#16A34A', fontWeight: 600 } : { color: '#374151' }}
                  >
                    {opt.label}
                    {isActive && <Check className="h-3.5 w-3.5" style={{ color: '#16A34A' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
