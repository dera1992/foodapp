'use client';

import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPaths } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils/cn';
import styles from './ProductEditorPage.module.css';

type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'expired';
type DeliveryOption = 'delivery' | 'pickup' | 'both';
type ProductLabel = '' | 'new' | 'hot' | 'last_few' | 'organic';

type ProductForm = {
  templateId: string;
  title: string;
  category: string;
  subcategory: string;
  barcode: string;
  price: string;
  discountPrice: string;
  expiryDate: string;
  status: ProductStatus;
  label: ProductLabel;
  delivery: DeliveryOption;
  quantity: string;
  available: boolean;
  images: File[];
  imagePreviews: string[];
  description: string;
};

type ProductTemplate = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  price: string;
  description: string;
};

type Category = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

type EditorMode = 'add' | 'edit';

const INITIAL_FORM: ProductForm = {
  templateId: '',
  title: '',
  category: '',
  subcategory: '',
  barcode: '',
  price: '',
  discountPrice: '',
  expiryDate: '',
  status: 'active',
  label: '',
  delivery: 'both',
  quantity: '',
  available: true,
  images: [],
  imagePreviews: [],
  description: ''
};

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'bakery',
    name: 'Bakery',
    subcategories: ['Bread', 'Cakes', 'Pastries', 'Muffins'].map((name) => ({ id: slugify(name), name }))
  },
  {
    id: 'dairy',
    name: 'Dairy',
    subcategories: ['Milk', 'Cheese', 'Yoghurt', 'Butter', 'Cream'].map((name) => ({ id: slugify(name), name }))
  },
  {
    id: 'produce',
    name: 'Produce',
    subcategories: ['Vegetables', 'Fruit', 'Salad', 'Herbs'].map((name) => ({ id: slugify(name), name }))
  },
  {
    id: 'grocery',
    name: 'Grocery',
    subcategories: ['Pasta & Rice', 'Condiments', 'Snacks'].map((name) => ({ id: slugify(name), name }))
  }
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function toBoolValue(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (['true', '1', 'yes'].includes(lower)) return true;
    if (['false', '0', 'no'].includes(lower)) return false;
  }
  if (typeof value === 'number') return value > 0;
  return fallback;
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

function backendUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? `${base}${path}` : path;
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function pickArray(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalizeCategories(payload: unknown): Category[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)
      ? (payload as { results: unknown[] }).results
      : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
        ? (payload as { data: unknown[] }).data
        : [];

  const normalized = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const id = toStringValue(entry.id || entry.slug || entry.value || entry.name);
      const name = toStringValue(entry.name || entry.title || entry.label || entry.id);
      const subs = (Array.isArray(entry.subcategories) ? entry.subcategories : []) as unknown[];
      return {
        id,
        name,
        subcategories: subs
          .map((sub) => {
            if (typeof sub === 'string') return { id: slugify(sub), name: sub };
            if (!sub || typeof sub !== 'object') return null;
            const subEntry = sub as Record<string, unknown>;
            const subName = toStringValue(subEntry.name || subEntry.title || subEntry.label || subEntry.id);
            if (!subName) return null;
            return { id: toStringValue(subEntry.id || subEntry.slug) || slugify(subName), name: subName };
          })
          .filter((sub): sub is { id: string; name: string } => Boolean(sub))
      } satisfies Category;
    })
    .filter((item): item is Category => Boolean(item && item.id && item.name));

  return normalized.length ? normalized : FALLBACK_CATEGORIES;
}

function normalizeTemplates(payload: unknown): ProductTemplate[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)
      ? (payload as { results: unknown[] }).results
      : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
        ? (payload as { data: unknown[] }).data
        : [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const title = pickString(entry, ['title', 'name']);
      const category = pickString(entry, ['category']);
      if (!title) return null;
      return {
        id: toStringValue(entry.id || title),
        title,
        category,
        subcategory: pickString(entry, ['subcategory']),
        price: pickString(entry, ['price']),
        description: pickString(entry, ['description'])
      } satisfies ProductTemplate;
    })
    .filter((item): item is ProductTemplate => Boolean(item));
}

function mapProductToForm(payload: unknown): ProductForm {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const imageCandidates = [
    ...pickArray(record, ['images', 'gallery']),
    record.image
  ];
  const imagePreviews = imageCandidates
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return pickString(item as Record<string, unknown>, ['url', 'image', 'src']);
      }
      return '';
    })
    .filter(Boolean);

  return {
    ...INITIAL_FORM,
    title: pickString(record, ['title', 'name', 'product_name']),
    category: pickString(record, ['category']),
    subcategory: pickString(record, ['subcategory']),
    barcode: pickString(record, ['barcode']),
    price: pickString(record, ['price']),
    discountPrice: pickString(record, ['discount_price', 'old_price']),
    expiryDate: pickString(record, ['expiry_date', 'expires_on', 'best_before']).slice(0, 10),
    status: (pickString(record, ['status']) as ProductStatus) || 'active',
    label: (pickString(record, ['label']) as ProductLabel) || '',
    delivery: (pickString(record, ['delivery', 'delivery_mode', 'delivery_type']) as DeliveryOption) || 'both',
    quantity: pickString(record, ['quantity', 'stock']),
    available: toBoolValue(record.available, true),
    images: [],
    imagePreviews,
    description: pickString(record, ['description'])
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(path, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function tryFetchJson(paths: string[]): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await fetchJson(path);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Request failed');
}

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} aria-hidden="true">{icon}</div>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

type Option = { value: string; label: string };

function FormField(props: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  type?: 'text' | 'number' | 'select';
  min?: number;
  step?: number;
  options?: Option[];
}) {
  const { label, name, value, onChange, placeholder, required, hint, type = 'text', min, step, options = [] } = props;
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label} {required ? <span className={styles.required}>*</span> : null}
        {hint ? <span className={styles.hint}> ({hint})</span> : null}
      </label>
      {type === 'select' ? (
        <select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={styles.select}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          className={styles.input}
        />
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        name="available"
        aria-label="Available for purchase"
      />
      <span className={styles.toggleSlider} />
    </label>
  );
}

function ImageUploader(props: {
  previews: string[];
  images: File[];
  onChange: (files: File[], previews: string[]) => void;
}) {
  const { previews, images, onChange } = props;
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((file) => file.size <= 5 * 1024 * 1024);
    if (!incoming.length) return;
    const previewPromises = incoming.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(String(event.target?.result ?? ''));
          reader.readAsDataURL(file);
        })
    );
    const nextPreviews = await Promise.all(previewPromises);
    onChange([...images, ...incoming], [...previews, ...nextPreviews]);
  };

  const removeImage = (index: number) => {
    const existingPreviewCount = Math.max(0, previews.length - images.length);
    const imageIndex = index - existingPreviewCount;
    onChange(
      images.filter((_, i) => i !== imageIndex),
      previews.filter((_, i) => i !== index)
    );
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFiles(event.target.files);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void processFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={cn(styles.uploadZone, isDragging && styles.uploadZoneActive)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
      >
        <div className={styles.uploadIcon} aria-hidden="true">🖼️</div>
        <p className={styles.uploadTitle}>Drag &amp; drop images here or click to browse</p>
        <span className={styles.uploadSub}>PNG, JPG, WEBP - max 5MB each. First image = cover photo.</span>
        <input
          ref={inputRef}
          type="file"
          name="images"
          multiple
          accept="image/*"
          className={styles.hiddenInput}
          onChange={onInputChange}
        />
      </div>

      {previews.length ? (
        <div className={styles.previewGrid}>
          {previews.map((src, index) => (
            <div className={styles.previewItem} key={`${src.slice(0, 24)}-${index}`}>
              <img src={src} alt={`Product preview ${index + 1}`} className={styles.previewImage} />
              {index === 0 ? <div className={styles.coverBadge}>COVER</div> : null}
              <button type="button" className={styles.removeImageBtn} onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`}>
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductEditorPage({ mode, productId }: { mode: EditorMode; productId?: string }) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && Boolean(productId);
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);

  const update = (patch: Partial<ProductForm>) => setForm((current) => ({ ...current, ...patch }));

  const currentSubcategories = useMemo(
    () =>
      (categories.find((category) => category.id === form.category)?.subcategories ?? []).map((sub) => ({
        value: sub.id,
        label: sub.name
      })),
    [categories, form.category]
  );

  const isValid = form.title.trim() !== '' && form.category !== '' && form.price !== '';

  const discountPct = useMemo(() => {
    const original = Number.parseFloat(form.price);
    const sale = Number.parseFloat(form.discountPrice);
    if (original > 0 && sale > 0 && sale < original) {
      return Math.round(((original - sale) / original) * 100);
    }
    return null;
  }, [form.price, form.discountPrice]);

  const daysUntilExpiry = useMemo(() => {
    if (!form.expiryDate) return null;
    return Math.ceil((new Date(form.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [form.expiryDate]);

  const expiryWarning = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setBootLoading(true);
      setError('');
      try {
        const [categoriesResult, templatesResult, productResult] = await Promise.allSettled([
          tryFetchJson(['/api/categories/']),
          tryFetchJson(['/api/products/templates/']),
          isEditMode && productId
            ? tryFetchJson([`/api/products/${productId}/`, backendUrl(`${apiPaths.adminProducts}${productId}/`)])
            : Promise.resolve(null)
        ]);

        if (cancelled) return;

        if (categoriesResult.status === 'fulfilled') {
          setCategories(normalizeCategories(categoriesResult.value));
        }

        if (templatesResult.status === 'fulfilled') {
          setTemplates(normalizeTemplates(templatesResult.value));
        }

        if (productResult.status === 'fulfilled' && productResult.value) {
          setForm((current) => ({ ...current, ...mapProductToForm(productResult.value) }));
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load product form data right now.');
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId]);

  const applyTemplate = () => {
    const template = templates.find((item) => item.id === form.templateId);
    if (!template) return;
    update({
      title: template.title,
      category: template.category,
      subcategory: template.subcategory,
      price: template.price,
      description: template.description
    });
  };

  const handleTemplateSelect = async (templateId: string) => {
    update({ templateId });
    if (!templateId) return;
    try {
      const payload = await tryFetchJson([`/api/products/templates/${templateId}/`]);
      const mapped = normalizeTemplates(Array.isArray(payload) ? payload : [payload])[0];
      if (mapped) {
        setTemplates((current) => {
          if (current.some((item) => item.id === mapped.id)) return current;
          return [mapped, ...current];
        });
      }
    } catch {
      // Template details endpoint is optional; manual apply still works from list data.
    }
  };

  const saveRequest = async (url: string, method: 'POST' | 'PUT', body: FormData) => {
    const csrf = getCookie('csrftoken');
    const response = await fetch(url, {
      method,
      body,
      credentials: 'include',
      headers: {
        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response;
  };

  const handleSave = async (statusOverride?: ProductStatus) => {
    if (!isValid) return;
    setError('');
    const draftMode = statusOverride === 'draft';
    if (draftMode) setSavingDraft(true);
    else setLoading(true);

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('subcategory', form.subcategory);
      fd.append('barcode', form.barcode);
      fd.append('price', form.price);
      fd.append('discount_price', form.discountPrice);
      fd.append('expiry_date', form.expiryDate);
      fd.append('status', statusOverride ?? form.status);
      fd.append('label', form.label);
      fd.append('delivery', form.delivery);
      fd.append('quantity', form.quantity);
      fd.append('available', String(form.available));
      fd.append('description', form.description);
      form.images.forEach((image) => fd.append('images', image));

      const promptUrl = isEditMode && productId ? `/api/products/${productId}/` : '/api/products/create/';
      const backendPath = isEditMode && productId ? `${apiPaths.adminProducts}${productId}/` : apiPaths.createProduct;
      const fallbackUrl = backendUrl(backendPath);
      const method: 'POST' | 'PUT' = isEditMode ? 'PUT' : 'POST';

      let res: Response | null = null;
      let lastError: unknown;

      for (const url of [promptUrl, fallbackUrl]) {
        try {
          res = await saveRequest(url, method, fd);
          if (res.ok) break;
          if (res.status === 404) {
            lastError = new Error(`Endpoint not found: ${url}`);
            continue;
          }
          const text = await res.text();
          throw new Error(text || `Request failed (${res.status})`);
        } catch (error) {
          lastError = error;
        }
      }

      if (!res?.ok) {
        throw lastError ?? new Error('Failed to save product');
      }

      router.push('/admin/products?saved=1');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageTopbar}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Home</span>
            <span className={styles.crumbSep}>›</span>
            <span>Products</span>
            <span className={styles.crumbSep}>›</span>
            <span className={styles.currentCrumb}>{isEditMode ? 'Edit Product' : 'Add Product'}</span>
          </div>
          <h1 className={styles.pageTitle}>Add / Edit Product</h1>
        </div>
        <button
          type="button"
          className={styles.bulkButton}
          onClick={() => router.push('/admin/products/bulk-upload')}
        >
          Bulk Upload Products
        </button>
      </div>

      <div className={styles.content}>
        {error ? <div className={styles.errorBanner}>{error}</div> : null}
        {bootLoading ? <div className={styles.loadingCard}>Loading product form...</div> : null}

        <SectionCard icon="📋" title="Use a Template">
          <div className={styles.templateRow}>
            <label htmlFor="template" className={styles.templateLabel}>Select a product template</label>
            <select
              id="template"
              name="template"
              value={form.templateId}
              onChange={(e) => void handleTemplateSelect(e.target.value)}
              className={styles.select}
            >
              <option value="">- No template -</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <button type="button" className={styles.outlineButton} onClick={applyTemplate}>
              Apply Template
            </button>
          </div>
        </SectionCard>

        <SectionCard icon="📝" title="General Information">
          <FormField
            label="Product Title"
            name="title"
            required
            value={form.title}
            onChange={(value) => update({ title: value })}
            placeholder="e.g. Wholemeal Bread Loaf"
          />

          <div className={styles.grid2}>
            <FormField
              label="Category"
              name="category"
              required
              type="select"
              value={form.category}
              onChange={(value) => update({ category: value, subcategory: '' })}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />

            <FormField
              label="Subcategory"
              name="subcategory"
              type="select"
              value={form.subcategory}
              onChange={(value) => update({ subcategory: value })}
              options={currentSubcategories}
            />
          </div>

          <FormField
            label="Barcode"
            name="barcode"
            hint="optional - scan or type"
            value={form.barcode}
            onChange={(value) => update({ barcode: value })}
            placeholder="e.g. 5000119314527"
          />
        </SectionCard>

        <SectionCard icon="💰" title="Pricing">
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="price" className={styles.label}>
                Original Price <span className={styles.required}>*</span>
              </label>
              <div className={styles.priceWrap}>
                <span className={styles.pricePrefix}>£</span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  className={styles.input}
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="discount_price" className={styles.label}>Discount / Sale Price</label>
              <div className={styles.priceWrap}>
                <span className={styles.pricePrefix}>£</span>
                <input
                  id="discount_price"
                  name="discount_price"
                  type="number"
                  min={0}
                  step="0.01"
                  className={styles.input}
                  value={form.discountPrice}
                  onChange={(e) => update({ discountPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {discountPct !== null ? (
            <div className={styles.discountNote}>
              <span className={styles.discountPill}>{discountPct}% off</span>
              <span>the original price</span>
            </div>
          ) : null}

          <div className={styles.currencyNote}>
            <span className={styles.currencyPill}>£ GBP</span>
            <span>Unit:</span>
            <span className={styles.currencyPill}>kg / each</span>
          </div>
        </SectionCard>

        <SectionCard icon="📅" title="Expiry & Status">
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label htmlFor="expiry_date" className={styles.label}>
                Expiry Date <span className={styles.required}>*</span>
              </label>
              <input
                id="expiry_date"
                name="expiry_date"
                type="date"
                className={styles.input}
                value={form.expiryDate}
                onChange={(e) => update({ expiryDate: e.target.value })}
              />
              {expiryWarning ? (
                <div className={styles.expiryTag}>
                  Expires in {daysUntilExpiry} day{daysUntilExpiry === 1 ? '' : 's'}!
                </div>
              ) : null}
            </div>

            <FormField
              label="Status"
              name="status"
              type="select"
              value={form.status}
              onChange={(value) => update({ status: value as ProductStatus })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'out_of_stock', label: 'Out of Stock' },
                { value: 'expired', label: 'Expired' }
              ]}
            />

            <FormField
              label="Label"
              name="label"
              type="select"
              value={form.label}
              onChange={(value) => update({ label: value as ProductLabel })}
              options={[
                { value: '', label: 'No label' },
                { value: 'new', label: 'New' },
                { value: 'hot', label: 'Hot deal' },
                { value: 'last_few', label: 'Last few' },
                { value: 'organic', label: 'Organic' }
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <FormField
              label="Delivery"
              name="delivery"
              type="select"
              value={form.delivery}
              onChange={(value) => update({ delivery: value as DeliveryOption })}
              options={[
                { value: 'delivery', label: 'Delivery available' },
                { value: 'pickup', label: 'Pickup only' },
                { value: 'both', label: 'Delivery & Pickup' }
              ]}
            />

            <FormField
              label="Stock Quantity"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={(value) => update({ quantity: value })}
              placeholder="e.g. 10"
              min={0}
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Available for purchase</div>
              <div className={styles.toggleSub}>Toggle off to temporarily hide from customers</div>
            </div>
            <Toggle checked={form.available} onChange={(value) => update({ available: value })} />
          </div>
        </SectionCard>

        <SectionCard icon="🖼️" title="Product Images">
          <ImageUploader
            images={form.images}
            previews={form.imagePreviews}
            onChange={(images, imagePreviews) => update({ images, imagePreviews })}
          />
        </SectionCard>

        <SectionCard icon="📄" title="Description">
          <div className={styles.fieldNoMargin}>
            <label htmlFor="description" className={styles.label}>
              Product Description <span className={styles.hint}>(optional but recommended)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className={styles.textarea}
              placeholder="Describe the product - ingredients, weight, flavour, storage info..."
            />
          </div>
        </SectionCard>
      </div>

      <div className={styles.actionBar}>
        <div className={cn(styles.actionStatus, isValid && styles.actionStatusReady)}>
          {isValid ? 'Ready to save' : 'Fill in required fields to save'}
        </div>
        <div className={styles.actionRight}>
          <button type="button" className={styles.cancelButton} onClick={() => router.push('/admin/products')}>
            Cancel
          </button>
          <button type="button" className={styles.outlineButton} onClick={() => void handleSave('draft')} disabled={savingDraft || loading}>
            {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => void handleSave('active')}
            disabled={!isValid || loading || savingDraft}
          >
            {loading ? 'Saving...' : isEditMode ? 'Save Product' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
