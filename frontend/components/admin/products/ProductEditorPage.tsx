'use client';

import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight, FileText, ImageIcon, Info, Layers, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  apiPaths,
  createFoodcreateCategory,
  createFoodcreateProductImage,
  createFoodcreateSubCategory,
  deleteFoodcreateCategory,
  deleteFoodcreateProductImage,
  deleteFoodcreateSubCategory,
  getFoodcreateCategories,
  getFoodcreateSubCategories,
  loadFoodcreateSubcategories,
  lookupFoodcreateProduct,
  patchFoodcreateCategory,
  patchFoodcreateSubCategory,
} from '@/lib/api/endpoints';
import { cn } from '@/lib/utils/cn';
import styles from './ProductEditorPage.module.css';

type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'expired';
type DeliveryOption = '' | 'delivery' | 'pickup' | 'both' | 'now';
type DeliveryTimeOption = '' | 'now' | '1-2days' | '2-3days' | '3-4days' | '4-5days' | '5-6days';
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
  deliveryTime: DeliveryTimeOption;
  brand: string;
  weight: string;
  quantity: string;
  available: boolean;
  existingImages: { id?: string; url: string }[];
  images: File[];
  imagePreviews: string[];
  description: string;
  nutrition: string;
};

type ProductTemplate = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  price: string;
  description: string;
  nutrition: string;
  delivery: DeliveryOption;
  deliveryTime: DeliveryTimeOption;
  brand: string;
  weight: string;
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
  deliveryTime: '',
  brand: '',
  weight: '',
  quantity: '',
  available: true,
  existingImages: [],
  images: [],
  imagePreviews: [],
  description: '',
  nutrition: ''
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
        description: pickString(entry, ['description']),
        nutrition: pickString(entry, ['nutrition', 'nutrition_info']),
        delivery: (pickString(entry, ['delivery']) as DeliveryOption) || '',
        deliveryTime: (pickString(entry, ['delivery_time', 'deliveryTime']) as DeliveryTimeOption) || '',
        brand: pickString(entry, ['brand']),
        weight: pickString(entry, ['weight'])
      } satisfies ProductTemplate;
    })
    .filter((item): item is ProductTemplate => Boolean(item));
}

function normalizeSubcategoryOptions(payload: unknown): { id: string; name: string }[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)
      ? (payload as { results: unknown[] }).results
      : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
        ? (payload as { data: unknown[] }).data
        : [];

  return list
    .map((item) => {
      if (typeof item === 'string') return { id: slugify(item), name: item };
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const name = toStringValue(entry.name || entry.title || entry.label || entry.id);
      if (!name) return null;
      return { id: toStringValue(entry.id || entry.slug) || slugify(name), name };
    })
    .filter((item): item is { id: string; name: string } => Boolean(item));
}

function mapProductToForm(payload: unknown): ProductForm {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const imageCandidates = [
    ...pickArray(record, ['images', 'gallery']),
    record.image
  ];
  const existingImages = imageCandidates
    .map((item) => {
      if (typeof item === 'string') return { url: item };
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const url = pickString(rec, ['url', 'image', 'src']);
        if (!url) return null;
        return { id: toStringValue(rec.id), url };
      }
      return null;
    })
    .filter((item): item is { id?: string; url: string } => Boolean(item && item.url));
  const imagePreviews = existingImages.map((img) => img.url);

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
    deliveryTime: (pickString(record, ['delivery_time', 'deliveryTime']) as DeliveryTimeOption) || '',
    brand: pickString(record, ['brand']),
    weight: pickString(record, ['weight']),
    quantity: pickString(record, ['quantity', 'stock']),
    available: toBoolValue(record.available, true),
    existingImages,
    images: [],
    imagePreviews,
    description: pickString(record, ['description']),
    nutrition: pickString(record, ['nutrition', 'nutrition_info'])
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
  disabled?: boolean;
}) {
  const { label, name, value, onChange, placeholder, required, hint, type = 'text', min, step, options = [], disabled } = props;
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label} {required ? <span className={styles.required}>*</span> : null}
        {hint ? <span className={styles.hint}> ({hint})</span> : null}
      </label>
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.select}
          disabled={disabled}
        >
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
          disabled={disabled}
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
  existingImages: { id?: string; url: string }[];
  previews: string[];
  images: File[];
  onChange: (files: File[], previews: string[]) => void;
  onDeleteExistingImage?: (image: { id?: string; url: string }, index: number) => Promise<void>;
  deletingExistingImageId?: string | null;
}) {
  const { existingImages, previews, images, onChange, onDeleteExistingImage, deletingExistingImageId } = props;
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
    const localPreviews = previews.slice(existingImages.length);
    onChange([...images, ...incoming], [...existingImages.map((img) => img.url), ...localPreviews, ...nextPreviews]);
  };

  const removeImage = async (index: number) => {
    const existingPreviewCount = existingImages.length;
    if (index < existingPreviewCount) {
      const existing = existingImages[index];
      if (!existing || !onDeleteExistingImage) return;
      await onDeleteExistingImage(existing, index);
      return;
    }
    const imageIndex = index - existingPreviewCount;
    const localPreviews = previews.slice(existingPreviewCount);
    onChange(images.filter((_, i) => i !== imageIndex), [
      ...existingImages.map((img) => img.url),
      ...localPreviews.filter((_, i) => i !== imageIndex),
    ]);
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
        <div className={styles.uploadIcon} aria-hidden="true"><ImageIcon size={28} /></div>
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
          {previews.map((src, index) => {
            const existingImage = index < existingImages.length ? existingImages[index] : undefined;
            const deletingThisExisting = Boolean(existingImage?.id && deletingExistingImageId === existingImage.id);
            return (
              <div className={styles.previewItem} key={`${src.slice(0, 24)}-${index}`}>
                <img src={src} alt={`Product preview ${index + 1}`} className={styles.previewImage} />
                {index === 0 ? <div className={styles.coverBadge}>COVER</div> : null}
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => void removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  disabled={deletingThisExisting}
                >
                  {deletingThisExisting ? '...' : 'x'}
                </button>
              </div>
            );
          })}
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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingSubcategoryId, setDeletingSubcategoryId] = useState<string | null>(null);
  const [deletingExistingImageId, setDeletingExistingImageId] = useState<string | null>(null);
  const [uploadingGalleryImages, setUploadingGalleryImages] = useState(false);
  const [taxonomyError, setTaxonomyError] = useState('');

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
  const canCreateSubcategory = form.category.trim() !== '';

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
        const [categoriesResult, templatesResult, subcategoriesResult, productResult] = await Promise.allSettled([
          getFoodcreateCategories(),
          lookupFoodcreateProduct(),
          getFoodcreateSubCategories(),
          isEditMode && productId
            ? tryFetchJson([`/api/products/${productId}/`, backendUrl(`${apiPaths.adminProducts}${productId}/`)])
            : Promise.resolve(null)
        ]);

        if (cancelled) return;

        if (categoriesResult.status === 'fulfilled') {
          let normalizedCategories = normalizeCategories(categoriesResult.value.data);
          if (subcategoriesResult.status === 'fulfilled') {
            const subs = normalizeSubcategoryOptions(subcategoriesResult.value.data);
            if (subs.length) {
              normalizedCategories = normalizedCategories.map((category) =>
                category.subcategories.length ? category : { ...category, subcategories: subs }
              );
            }
          }
          setCategories(normalizedCategories);
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

  useEffect(() => {
    if (!form.category) return;
    let cancelled = false;

    const loadSubs = async () => {
      try {
        const payload = await loadFoodcreateSubcategories(form.category);
        if (cancelled) return;
        const subs = normalizeSubcategoryOptions(payload);
        if (!subs.length) return;
        setCategories((current) =>
          current.map((category) =>
            category.id === form.category ? { ...category, subcategories: subs } : category
          )
        );
      } catch {
        // Keep current options if the endpoint is unavailable or rejects this category.
      }
    };

    void loadSubs();
    return () => {
      cancelled = true;
    };
  }, [form.category]);

  const applyTemplate = () => {
    const template = templates.find((item) => item.id === form.templateId);
    if (!template) return;
    update({
      title: template.title,
      category: template.category,
      subcategory: template.subcategory,
      price: template.price,
      description: template.description,
      nutrition: template.nutrition,
      delivery: template.delivery || form.delivery,
      deliveryTime: template.deliveryTime,
      brand: template.brand,
      weight: template.weight,
    });
  };

  const handleTemplateSelect = async (templateId: string) => {
    update({ templateId });
    if (!templateId) return;
    try {
      const payload = await lookupFoodcreateProduct({ id: templateId });
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

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setTaxonomyError('');
    setCreatingCategory(true);
    try {
      let created: unknown;
      const attempts: Record<string, unknown>[] = [{ name }, { title: name }, { category_name: name }];
      let lastError: unknown;
      for (const payload of attempts) {
        try {
          created = await createFoodcreateCategory(payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!created) throw (lastError ?? new Error('Create category failed'));

      const record = created && typeof created === 'object' ? (created as Record<string, unknown>) : {};
      const createdName = toStringValue(record.name || record.title || name) || name;
      const createdId = toStringValue(record.id || record.slug || createdName) || slugify(createdName);
      const nextCategory: Category = { id: createdId, name: createdName, subcategories: [] };

      setCategories((current) => {
        const deduped = current.filter((c) => String(c.id) !== String(nextCategory.id));
        return [nextCategory, ...deduped];
      });
      update({ category: createdId, subcategory: '' });
      setNewCategoryName('');
      toast.success(`Category "${createdName}" created.`);
    } catch {
      setTaxonomyError('Unable to create category right now.');
      toast.error('Unable to create category right now.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubcategory = async () => {
    const name = newSubcategoryName.trim();
    if (!name || !form.category) return;
    setTaxonomyError('');
    setCreatingSubcategory(true);
    try {
      let created: unknown;
      const attempts: Record<string, unknown>[] = [
        { name, category: form.category },
        { name, category_id: form.category },
        { title: name, category: form.category },
        { name, parent: form.category },
      ];
      let lastError: unknown;
      for (const payload of attempts) {
        try {
          created = await createFoodcreateSubCategory(payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!created) throw (lastError ?? new Error('Create subcategory failed'));

      const record = created && typeof created === 'object' ? (created as Record<string, unknown>) : {};
      const createdName = toStringValue(record.name || record.title || name) || name;
      const createdId = toStringValue(record.id || record.slug || createdName) || slugify(createdName);
      const nextSub = { id: createdId, name: createdName };

      setCategories((current) =>
        current.map((category) =>
          category.id === form.category
            ? {
                ...category,
                subcategories: [
                  nextSub,
                  ...category.subcategories.filter((sub) => String(sub.id) !== String(nextSub.id)),
                ],
              }
            : category
        )
      );
      update({ subcategory: createdId });
      setNewSubcategoryName('');
      toast.success(`Subcategory "${createdName}" created.`);
    } catch {
      setTaxonomyError('Unable to create subcategory right now.');
      toast.error('Unable to create subcategory right now.');
    } finally {
      setCreatingSubcategory(false);
    }
  };

  const handleRenameCategory = async (category: Category) => {
    const nextName = window.prompt('Rename category', category.name)?.trim();
    if (!nextName || nextName === category.name) return;
    setTaxonomyError('');
    setEditingCategoryId(category.id);
    try {
      let updated: unknown;
      const attempts: Record<string, unknown>[] = [{ name: nextName }, { title: nextName }];
      let lastError: unknown;
      for (const payload of attempts) {
        try {
          updated = await patchFoodcreateCategory(category.id, payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!updated) throw (lastError ?? new Error('Rename category failed'));
      const record = updated as Record<string, unknown>;
      const resolvedName = toStringValue(record.name || record.title) || nextName;
      setCategories((current) =>
        current.map((c) => (c.id === category.id ? { ...c, name: resolvedName } : c))
      );
      toast.success(`Category renamed to "${resolvedName}".`);
    } catch {
      setTaxonomyError('Unable to rename category right now.');
      toast.error('Unable to rename category right now.');
    } finally {
      setEditingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setTaxonomyError('');
    setDeletingCategoryId(category.id);
    try {
      await deleteFoodcreateCategory(category.id);
      setCategories((current) => current.filter((c) => c.id !== category.id));
      if (form.category === category.id) update({ category: '', subcategory: '' });
      toast.success(`Category "${category.name}" deleted.`);
    } catch {
      setTaxonomyError('Unable to delete category right now.');
      toast.error('Unable to delete category right now.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleRenameSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    const nextName = window.prompt('Rename subcategory', subcategoryName)?.trim();
    if (!nextName || nextName === subcategoryName) return;
    setTaxonomyError('');
    setEditingSubcategoryId(subcategoryId);
    try {
      let updated: unknown;
      const attempts: Record<string, unknown>[] = [{ name: nextName }, { title: nextName }];
      let lastError: unknown;
      for (const payload of attempts) {
        try {
          updated = await patchFoodcreateSubCategory(subcategoryId, payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!updated) throw (lastError ?? new Error('Rename subcategory failed'));
      const record = updated as Record<string, unknown>;
      const resolvedName = toStringValue(record.name || record.title) || nextName;
      setCategories((current) =>
        current.map((category) => ({
          ...category,
          subcategories: category.subcategories.map((sub) =>
            sub.id === subcategoryId ? { ...sub, name: resolvedName } : sub
          ),
        }))
      );
      toast.success(`Subcategory renamed to "${resolvedName}".`);
    } catch {
      setTaxonomyError('Unable to rename subcategory right now.');
      toast.error('Unable to rename subcategory right now.');
    } finally {
      setEditingSubcategoryId(null);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    if (!window.confirm(`Delete subcategory "${subcategoryName}"?`)) return;
    setTaxonomyError('');
    setDeletingSubcategoryId(subcategoryId);
    try {
      await deleteFoodcreateSubCategory(subcategoryId);
      setCategories((current) =>
        current.map((category) => ({
          ...category,
          subcategories: category.subcategories.filter((sub) => sub.id !== subcategoryId),
        }))
      );
      if (form.subcategory === subcategoryId) update({ subcategory: '' });
      toast.success(`Subcategory "${subcategoryName}" deleted.`);
    } catch {
      setTaxonomyError('Unable to delete subcategory right now.');
      toast.error('Unable to delete subcategory right now.');
    } finally {
      setDeletingSubcategoryId(null);
    }
  };

  const handleDeleteExistingImage = async (image: { id?: string; url: string }, index: number) => {
    if (!image.id) {
      update({
        existingImages: form.existingImages.filter((_, i) => i !== index),
        imagePreviews: form.imagePreviews.filter((_, i) => i !== index),
      });
      return;
    }

    setError('');
    setDeletingExistingImageId(image.id);
    try {
      await deleteFoodcreateProductImage(image.id);
      update({
        existingImages: form.existingImages.filter((_, i) => i !== index),
        imagePreviews: form.imagePreviews.filter((_, i) => i !== index),
      });
      toast.success('Image removed.');
    } catch {
      setError('Unable to delete image right now.');
      toast.error('Unable to delete image right now.');
    } finally {
      setDeletingExistingImageId(null);
    }
  };

  const handleUploadGalleryImages = async () => {
    if (!isEditMode || !productId || form.images.length === 0) return;
    setError('');
    setUploadingGalleryImages(true);
    try {
      const createdImages: { id?: string; url: string }[] = [];

      for (const file of form.images) {
        let responsePayload: unknown;
        let lastError: unknown;
        const buildAttempts = () => {
          const fd1 = new FormData();
          fd1.append('product', productId);
          fd1.append('image', file);
          const fd2 = new FormData();
          fd2.append('product_id', productId);
          fd2.append('image', file);
          const fd3 = new FormData();
          fd3.append('product', productId);
          fd3.append('images', file);
          return [fd1, fd2, fd3];
        };

        for (const fd of buildAttempts()) {
          try {
            responsePayload = await createFoodcreateProductImage(fd);
            break;
          } catch (error) {
            lastError = error;
          }
        }

        if (!responsePayload) throw (lastError ?? new Error('Image upload failed'));

        const item =
          Array.isArray(responsePayload) ? responsePayload[0]
            : responsePayload && typeof responsePayload === 'object' && Array.isArray((responsePayload as { results?: unknown[] }).results)
              ? (responsePayload as { results: unknown[] }).results[0]
              : responsePayload;
        const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const url = pickString(record, ['url', 'image', 'src']);
        if (url) createdImages.push({ id: toStringValue(record.id), url });
      }

      if (createdImages.length) {
        const nextExisting = [...form.existingImages, ...createdImages];
        update({
          existingImages: nextExisting,
          images: [],
          imagePreviews: nextExisting.map((img) => img.url),
        });
        toast.success(`${createdImages.length} image${createdImages.length === 1 ? '' : 's'} uploaded to gallery.`);
      }
    } catch {
      setError('Unable to upload images to gallery right now.');
      toast.error('Unable to upload images to gallery right now.');
    } finally {
      setUploadingGalleryImages(false);
    }
  };

  const saveRequest = async (url: string, method: 'POST' | 'PUT', body: FormData) => {
    const csrf = getCookie('csrftoken');
    const accessToken = getCookie('access_token');
    const response = await fetch(url, {
      method,
      body,
      credentials: 'include',
      headers: {
        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
      fd.append('delivery_time', form.deliveryTime);
      fd.append('brand', form.brand);
      fd.append('weight', form.weight);
      fd.append('quantity', form.quantity);
      fd.append('available', String(form.available));
      fd.append('description', form.description);
      fd.append('nutrition', form.nutrition);
      form.images.forEach((image) => fd.append('images', image));

      const backendPath = isEditMode && productId ? `${apiPaths.adminProducts}${productId}/` : apiPaths.createProduct;
      const fallbackUrl = backendUrl(backendPath);
      const method: 'POST' | 'PUT' = isEditMode ? 'PUT' : 'POST';

      let res: Response | null = null;
      let lastError: unknown;

      for (const url of [fallbackUrl]) {
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
            <ChevronRight className={styles.crumbSepIcon} />
            <span>Products</span>
            <ChevronRight className={styles.crumbSepIcon} />
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

        <SectionCard icon={<Layers size={16} />} title="Use a Template">
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

        <SectionCard icon={<Info size={16} />} title="General Information">
          <FormField
            label="Product Title"
            name="title"
            required
            value={form.title}
            onChange={(value) => update({ title: value })}
            placeholder="e.g. Wholemeal Bread Loaf"
          />

	          <div className={styles.grid2}>
	            <div>
	              <FormField
	                label="Category"
	                name="category"
	                required
	                type="select"
	                value={form.category}
	                onChange={(value) => {
	                  setTaxonomyError('');
	                  update({ category: value, subcategory: '' });
	                }}
	                options={categories.map((category) => ({ value: category.id, label: category.name }))}
	              />
	              <div className={styles.inlineManageRow}>
	                <input
	                  type="text"
	                  value={newCategoryName}
	                  onChange={(e) => setNewCategoryName(e.target.value)}
	                  placeholder="Add category"
	                  className={styles.inlineManageInput}
	                />
	                <button
	                  type="button"
	                  className={styles.inlineManageButton}
	                  onClick={() => void handleCreateCategory()}
	                  disabled={creatingCategory || !newCategoryName.trim()}
	                >
	                  {creatingCategory ? 'Adding...' : 'Add'}
	                </button>
	              </div>
	              <div className={styles.taxonomyList}>
	                {categories.map((category) => {
	                  const selected = category.id === form.category;
	                  const busy = editingCategoryId === category.id || deletingCategoryId === category.id;
	                  return (
	                    <div key={category.id} className={`${styles.taxonomyChip}${selected ? ` ${styles.taxonomyChipSelected}` : ''}`}>
	                      <button
	                        type="button"
	                        className={styles.taxonomyChipLabel}
	                        onClick={() => update({ category: category.id, subcategory: '' })}
	                      >
	                        {category.name}
	                      </button>
	                      <button
	                        type="button"
	                        className={styles.taxonomyChipAction}
	                        onClick={() => void handleRenameCategory(category)}
	                        disabled={busy}
	                      >
	                        {editingCategoryId === category.id ? '...' : 'Edit'}
	                      </button>
	                      <button
	                        type="button"
	                        className={`${styles.taxonomyChipAction} ${styles.taxonomyChipDelete}`}
	                        onClick={() => void handleDeleteCategory(category)}
	                        disabled={busy}
	                      >
	                        {deletingCategoryId === category.id ? '...' : 'Del'}
	                      </button>
	                    </div>
	                  );
	                })}
	              </div>
	            </div>

	            <div>
	              <FormField
	                label="Subcategory"
	                name="subcategory"
	                type="select"
	                value={form.subcategory}
	                onChange={(value) => update({ subcategory: value })}
	                options={currentSubcategories}
	                disabled={!form.category}
	                hint={!form.category ? 'select category first' : undefined}
	              />
	              <div className={styles.inlineManageRow}>
	                <input
	                  type="text"
	                  value={newSubcategoryName}
	                  onChange={(e) => setNewSubcategoryName(e.target.value)}
	                  placeholder={form.category ? 'Add subcategory' : 'Select category first'}
	                  className={styles.inlineManageInput}
	                  disabled={!canCreateSubcategory}
	                />
	                <button
	                  type="button"
	                  className={styles.inlineManageButton}
	                  onClick={() => void handleCreateSubcategory()}
	                  disabled={creatingSubcategory || !canCreateSubcategory || !newSubcategoryName.trim()}
	                >
	                  {creatingSubcategory ? 'Adding...' : 'Add'}
	                </button>
	              </div>
	              <div className={styles.taxonomyList}>
	                {currentSubcategories.map((subcategory) => {
	                  const busy =
	                    editingSubcategoryId === subcategory.value || deletingSubcategoryId === subcategory.value;
	                  const selected = subcategory.value === form.subcategory;
	                  return (
	                    <div key={subcategory.value} className={`${styles.taxonomyChip}${selected ? ` ${styles.taxonomyChipSelected}` : ''}`}>
	                      <button
	                        type="button"
	                        className={styles.taxonomyChipLabel}
	                        onClick={() => update({ subcategory: subcategory.value })}
	                      >
	                        {subcategory.label}
	                      </button>
	                      <button
	                        type="button"
	                        className={styles.taxonomyChipAction}
	                        onClick={() => void handleRenameSubcategory(subcategory.value, subcategory.label)}
	                        disabled={busy}
	                      >
	                        {editingSubcategoryId === subcategory.value ? '...' : 'Edit'}
	                      </button>
	                      <button
	                        type="button"
	                        className={`${styles.taxonomyChipAction} ${styles.taxonomyChipDelete}`}
	                        onClick={() => void handleDeleteSubcategory(subcategory.value, subcategory.label)}
	                        disabled={busy}
	                      >
	                        {deletingSubcategoryId === subcategory.value ? '...' : 'Del'}
	                      </button>
	                    </div>
	                  );
	                })}
	                {form.category && currentSubcategories.length === 0 ? (
	                  <div className={styles.taxonomyEmpty}>No subcategories yet for this category.</div>
	                ) : null}
	              </div>
	            </div>
	          </div>
	          {taxonomyError ? <div className={styles.taxonomyError}>{taxonomyError}</div> : null}

          <div className={styles.grid3}>
            <FormField
              label="Barcode"
              name="barcode"
              hint="optional - scan or type"
              value={form.barcode}
              onChange={(value) => update({ barcode: value })}
              placeholder="e.g. 5000119314527"
            />
            <FormField
              label="Brand"
              name="brand"
              hint="optional"
              value={form.brand}
              onChange={(value) => update({ brand: value })}
              placeholder="e.g. Heinz"
            />
            <FormField
              label="Weight"
              name="weight"
              hint="optional"
              value={form.weight}
              onChange={(value) => update({ weight: value })}
              placeholder="e.g. 500g / 1kg / 2L"
            />
          </div>
        </SectionCard>

        <SectionCard icon={<Wallet size={16} />} title="Pricing">
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
            <span className={styles.currencyPill}>£</span>
            <span>Unit:</span>
            <span className={styles.currencyPill}>kg / each</span>
          </div>
        </SectionCard>

        <SectionCard icon={<CalendarDays size={16} />} title="Expiry & Status">
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

          <div className={styles.grid3}>
            <FormField
              label="Delivery"
              name="delivery"
              type="select"
              value={form.delivery}
              onChange={(value) => update({ delivery: value as DeliveryOption })}
              options={[
                { value: 'now', label: 'Now' },
                { value: 'delivery', label: 'Delivery available' },
                { value: 'pickup', label: 'Pickup only' },
                { value: 'both', label: 'Delivery & Pickup' }
              ]}
            />
            <FormField
              label="Delivery Time"
              name="delivery_time"
              type="select"
              value={form.deliveryTime}
              onChange={(value) => update({ deliveryTime: value as DeliveryTimeOption })}
              options={[
                { value: 'now', label: 'Now' },
                { value: '1-2days', label: '1-2 days' },
                { value: '2-3days', label: '2-3 days' },
                { value: '3-4days', label: '3-4 days' },
                { value: '4-5days', label: '4-5 days' },
                { value: '5-6days', label: '5-6 days' }
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

        <SectionCard icon={<ImageIcon size={16} />} title="Product Images">
          <div className={styles.imageStatusRow}>
            <span className={styles.imageStatusBadge}>Uploaded {form.existingImages.length}</span>
            <span className={`${styles.imageStatusBadge} ${form.images.length ? styles.imageStatusBadgePending : ''}`}>
              Unsaved images {form.images.length}
            </span>
          </div>
          <ImageUploader
            existingImages={form.existingImages}
            images={form.images}
            previews={form.imagePreviews}
            onChange={(images, imagePreviews) => update({ images, imagePreviews })}
            onDeleteExistingImage={handleDeleteExistingImage}
            deletingExistingImageId={deletingExistingImageId}
          />
          {isEditMode ? (
            <div className={styles.imageActionsRow}>
              <button
                type="button"
                className={styles.outlineButton}
                onClick={() => void handleUploadGalleryImages()}
                disabled={uploadingGalleryImages || form.images.length === 0}
              >
                {uploadingGalleryImages ? 'Uploading...' : `Upload selected images now${form.images.length ? ` (${form.images.length})` : ''}`}
              </button>
              <span className={styles.galleryHint}>
                Upload selected files to gallery now (image endpoint), or save product to submit them together.
              </span>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard icon={<FileText size={16} />} title="Description">
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
          <div className={styles.fieldNoMargin}>
            <label htmlFor="nutrition" className={styles.label}>
              Nutrition Information <span className={styles.hint}>(optional)</span>
            </label>
            <textarea
              id="nutrition"
              name="nutrition"
              rows={4}
              value={form.nutrition}
              onChange={(e) => update({ nutrition: e.target.value })}
              className={styles.textarea}
              placeholder="Add nutrition details (calories, fat, protein, carbs, allergens, etc.)."
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
