'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus } from 'lucide-react';
import type { Session } from '@/lib/auth/session';

export function FeatureStrip({ session }: { session: Session }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddProductClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (session.role === 'shop') return;

    event.preventDefault();

    if (!session.isAuthenticated) {
      router.push('/login?next=%2Faccount%2Fshop%2Fonboarding');
      return;
    }

    setNotice('You need to own a shop account to add products.');
    window.setTimeout(() => setNotice(null), 3200);
  };

  return (
    <div className="feature-strip">
      <div className="feature-strip-inner">
        <Link href="/budget/create" className="fs-item">
          <div className="fs-icon fs-amber">{'\u{1F4B0}'}</div>
          <div className="fs-text">
            <div className="fs-title">Budget Planner</div>
            <div className="fs-sub">Plan your weekly shop within budget</div>
          </div>
          <button className="fs-cta fs-cta-amber" type="button">
            Plan now <ArrowRight size={12} />
          </button>
        </Link>

        <Link href="/admin/products/new" className="fs-item" onClick={handleAddProductClick}>
          <div className="fs-icon fs-green">{'\u{1F3EA}'}</div>
          <div className="fs-text">
            <div className="fs-title">Shop Owner?</div>
            <div className="fs-sub">List near-expiry products in seconds</div>
          </div>
          <button className="fs-cta fs-cta-green" type="button">
            Add product <Plus size={12} />
          </button>
        </Link>

        <Link href="/order-tracking" className="fs-item">
          <div className="fs-icon fs-purple">{'\u{1F4E6}'}</div>
          <div className="fs-text">
            <div className="fs-title">Track Your Order</div>
            <div className="fs-sub">Real-time delivery &amp; pickup status</div>
          </div>
          <button className="fs-cta fs-cta-purple" type="button">
            Track order <ArrowRight size={12} />
          </button>
        </Link>
      </div>
      {notice ? (
        <p
          role="status"
          aria-live="polite"
          style={{ marginTop: 12, color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center' }}
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
