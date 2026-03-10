type ProductUrlInput = {
  id: string | number;
  slug?: string | null;
  name?: string | null;
};

type ProductExpiryInput = {
  expiresOn?: string | null;
};

export function slugifyProductSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductPath(product: ProductUrlInput): string {
  const id = String(product.id ?? '').trim();
  const slug = slugifyProductSegment(product.slug || product.name || '');
  if (!id) return '/products';
  return slug ? `/products/${id}/${slug}` : `/products/${id}`;
}

export function isProductExpired(product: ProductExpiryInput): boolean {
  if (!product.expiresOn) return false;
  const expiry = new Date(product.expiresOn);
  if (Number.isNaN(expiry.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry.getTime() < today.getTime();
}

export function filterVisibleProducts<T extends ProductExpiryInput>(products: T[]): T[] {
  return products.filter((product) => !isProductExpired(product));
}
