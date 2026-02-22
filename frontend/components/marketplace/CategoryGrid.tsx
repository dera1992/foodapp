'use client';

import { useState } from 'react';

const categories = [
  { label: 'Vegetables', icon: '🥦', tone: 'bg-green-100' },
  { label: 'Fruits', icon: '🍎', tone: 'bg-orange-100' },
  { label: 'Grains', icon: '🌾', tone: 'bg-yellow-100' },
  { label: 'Seafood', icon: '🐟', tone: 'bg-sky-100' },
  { label: 'Spices', icon: '🌶️', tone: 'bg-rose-100' },
  { label: 'Meats', icon: '🥩', tone: 'bg-red-100' },
  { label: 'Cooking Oil', icon: '🫒', tone: 'bg-amber-100' },
  { label: 'Honey', icon: '🍯', tone: 'bg-yellow-100' },
  { label: 'Eggs', icon: '🥚', tone: 'bg-lime-100' },
  { label: 'Others', icon: '🧺', tone: 'bg-slate-100' }
];

export function CategoryGrid() {
  const [active, setActive] = useState('Vegetables');

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => {
        const isActive = category.label === active;
        return (
          <button
            type="button"
            key={category.label}
            onClick={() => setActive(category.label)}
            className={`rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${isActive ? 'border-[#2d7a3a] bg-[#e8f5eb]' : 'border-transparent'}`}
          >
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${category.tone}`}>{category.icon}</div>
            <p className="text-sm font-semibold text-slate-900">{category.label}</p>
          </button>
        );
      })}
    </div>
  );
}