'use client';

import { Minus, Plus } from 'lucide-react';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-xl border border-brand-border bg-white">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="p-2" aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold">{value}</span>
      <button onClick={() => onChange(value + 1)} className="p-2" aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
