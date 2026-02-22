'use client';

import { Minus, Plus } from 'lucide-react';

type QuantityControlProps = {
  value: number;
  min?: number;
  compact?: boolean;
  onChange: (nextValue: number) => void;
};

export function QuantityControl({ value, min = 1, compact = false, onChange }: QuantityControlProps) {
  const nextDown = Math.max(min, value - 1);
  const buttonClass = compact ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <div className={`bf-qty-control ${compact ? 'bf-qty-control--compact' : ''}`}>
      <button type="button" className={buttonClass} onClick={() => onChange(nextDown)} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <span className="bf-qty-value">{value}</span>
      <button type="button" className={buttonClass} onClick={() => onChange(value + 1)} aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
