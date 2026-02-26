import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';

export function FeatureStrip() {
  return (
    <div className="feature-strip">
      <div className="feature-strip-inner">
        <Link href="/budget/create" className="fs-item">
          <div className="fs-icon fs-amber">💰</div>
          <div className="fs-text">
            <div className="fs-title">Budget Planner</div>
            <div className="fs-sub">Plan your weekly shop within budget</div>
          </div>
          <button className="fs-cta fs-cta-amber" type="button">
            Plan now <ArrowRight size={12} />
          </button>
        </Link>

        <Link href="/admin/products/new" className="fs-item">
          <div className="fs-icon fs-green">🏪</div>
          <div className="fs-text">
            <div className="fs-title">Shop Owner?</div>
            <div className="fs-sub">List near-expiry products in seconds</div>
          </div>
          <button className="fs-cta fs-cta-green" type="button">
            Add product <Plus size={12} />
          </button>
        </Link>

        <Link href="/order-tracking" className="fs-item">
          <div className="fs-icon fs-purple">📦</div>
          <div className="fs-text">
            <div className="fs-title">Track Your Order</div>
            <div className="fs-sub">Real-time delivery &amp; pickup status</div>
          </div>
          <button className="fs-cta fs-cta-purple" type="button">
            Track order <ArrowRight size={12} />
          </button>
        </Link>
      </div>
    </div>
  );
}
