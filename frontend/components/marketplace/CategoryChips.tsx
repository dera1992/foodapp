import Link from 'next/link';

const defaultCategories = [
  { name: 'Vegetables', icon: '🥦' },
  { name: 'Fruits', icon: '🍎' },
  { name: 'Grains', icon: '🌾' },
  { name: 'Seafood', icon: '🦐' },
  { name: 'Spices', icon: '🌶️' },
  { name: 'Dairy', icon: '🥛' }
];

export function CategoryChips({ categories = defaultCategories }: { categories?: Array<{ name: string; icon: string }> }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Link
          key={category.name}
          href={`/shops?category=${encodeURIComponent(category.name)}`}
          className="inline-flex min-w-fit items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-text transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <span aria-hidden="true">{category.icon}</span>
          {category.name}
        </Link>
      ))}
    </div>
  );
}
