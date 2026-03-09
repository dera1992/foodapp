'use client';

import { type ChangeEvent, type DragEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ingredients: string;
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
  ingredients: '',
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

function extractProductImageUrl(record: Record<string, unknown>): string {
  return pickString(record, ['url', 'image', 'src', 'product_image']);
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
        const url = extractProductImageUrl(rec);
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
    ingredients: pickString(record, ['ingredients', 'ingredients_text']),
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

// ── Scan types ──────────────────────────────────────────────────────────────
type ScanMode = 'manual' | 'barcode' | 'ai';

type ScanResult = {
  title?: string;
  brand?: string;
  category?: string;
  weight?: string;
  description?: string;
  ingredients?: string;
  nutrition?: string;
  barcode?: string;
  confidence?: number;
  tags?: string[];
};

// ── Open Food Facts barcode lookup ──────────────────────────────────────────
async function lookupBarcode(barcode: string): Promise<ScanResult> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Barcode lookup failed');
  const json = (await res.json()) as { status: number; product?: Record<string, unknown> };
  if (!json.product || json.status === 0) throw new Error('Product not found');
  const p = json.product;
  const getString = (keys: string[]) => {
    for (const k of keys) {
      if (typeof p[k] === 'string' && (p[k] as string).trim()) return (p[k] as string).trim();
    }
    return '';
  };
  const nutriments = p['nutriments'] as Record<string, unknown> | undefined;
  const nutritionLines: string[] = [];
  if (nutriments) {
    const fmt = (label: string, key: string) => {
      const v = nutriments[key];
      if (v !== undefined && v !== '') nutritionLines.push(`${label}: ${v}`);
    };
    fmt('Calories (kcal)', 'energy-kcal_100g');
    fmt('Fat (g)', 'fat_100g');
    fmt('Saturated fat (g)', 'saturated-fat_100g');
    fmt('Carbohydrates (g)', 'carbohydrates_100g');
    fmt('Sugars (g)', 'sugars_100g');
    fmt('Fibre (g)', 'fiber_100g');
    fmt('Protein (g)', 'proteins_100g');
    fmt('Salt (g)', 'salt_100g');
  }
  const rawCategory = getString(['categories_tags', 'categories']);
  const category = rawCategory.split(',')[0]?.replace(/^en:/, '').replace(/-/g, ' ').trim() ?? '';
  return {
    title: getString(['product_name', 'product_name_en']),
    brand: getString(['brands']),
    category,
    weight: getString(['quantity', 'net_weight_value']),
    description: getString(['generic_name', 'product_name']),
    ingredients: getString(['ingredients_text_en', 'ingredients_text']),
    nutrition: nutritionLines.join('\n'),
    barcode,
    confidence: 95,
    tags: [],
  };
}

// ── BarcodeScanner ───────────────────────────────────────────────────────────
function BarcodeScanner({ onResult }: { onResult: (result: ScanResult) => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      if (!('BarcodeDetector' in window)) {
        setScanError('Live barcode scanning not supported in this browser. Enter barcode manually instead.');
        stopCamera();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const barcodes = await detector.detect(videoRef.current) as any[];
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue as string;
            stopCamera();
            setInput(code);
            setLoading(true);
            try {
              const result = await lookupBarcode(code);
              onResult(result);
            } catch {
              setScanError('Barcode found but product not in database. Try manual lookup.');
            } finally {
              setLoading(false);
            }
          }
        } catch { /* keep scanning */ }
      }, 600);
    } catch {
      setScanError('Camera access denied or unavailable.');
      setScanning(false);
    }
  };

  const handleLookup = async () => {
    const barcode = input.trim();
    if (!barcode) return;
    setLoading(true);
    setScanError('');
    try {
      const result = await lookupBarcode(barcode);
      onResult(result);
    } catch {
      setScanError('Product not found for this barcode. Try a different barcode or switch to manual entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: '#6b7b6d', marginBottom: '12px' }}>
        Scan or enter a barcode to auto-fill product details from Open Food Facts.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleLookup(); }}
          placeholder="Enter or paste barcode number..."
          className={styles.input}
          style={{ flex: 1, minWidth: '180px' }}
        />
        <button type="button" className={styles.outlineButton} onClick={() => void handleLookup()} disabled={loading || !input.trim()}>
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
        {!scanning ? (
          <button type="button" className={styles.outlineButton} onClick={() => void startCamera()}>
            Scan Camera
          </button>
        ) : (
          <button type="button" className={styles.cancelButton} onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>
      {scanning && (
        <div style={{ marginTop: '12px', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #2d7a3a' }}>
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} muted playsInline />
          <p style={{ fontSize: '0.78rem', color: '#6b7b6d', margin: '6px 0 0', textAlign: 'center' }}>
            Hold barcode up to the camera...
          </p>
        </div>
      )}
      {scanError ? <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '8px' }}>{scanError}</p> : null}
    </div>
  );
}

// ── AICameraScanner ─────────────────────────────────────────────────────────
function AICameraScanner({ onResult }: { onResult: (result: ScanResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCapturing(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const sendToAI = async (base64: string, mimeType: string) => {
    setLoading(true);
    setScanError('');
    try {
      const res = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error('AI scan failed');
      const data = (await res.json()) as ScanResult;
      onResult(data);
    } catch {
      setScanError('AI scan failed. Please try again or use manual entry.');
    } finally {
      setLoading(false);
    }
  };

  const startCapture = async () => {
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCapturing(true);
    } catch {
      setScanError('Camera access denied or unavailable.');
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    stopCamera();
    await sendToAI(base64, 'image/jpeg');
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      void sendToAI(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: '#6b7b6d', marginBottom: '12px' }}>
        Take a photo or upload a product image — AI will identify it and fill in the details.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!capturing ? (
          <button type="button" className={styles.outlineButton} onClick={() => void startCapture()} disabled={loading}>
            Open Camera
          </button>
        ) : (
          <>
            <button type="button" className={styles.saveButton} onClick={() => void captureFrame()} disabled={loading}>
              {loading ? 'Scanning...' : 'Capture Photo'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={stopCamera}>
              Cancel
            </button>
          </>
        )}
        <button type="button" className={styles.outlineButton} onClick={() => fileRef.current?.click()} disabled={loading}>
          {loading ? 'Scanning...' : 'Upload Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
      </div>
      {capturing && (
        <div style={{ marginTop: '12px', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #2d7a3a' }}>
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} muted playsInline />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {scanError ? <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '8px' }}>{scanError}</p> : null}
    </div>
  );
}

// ── AutofillPreview ──────────────────────────────────────────────────────────
function AutofillPreview({ result, onApply, onDismiss }: {
  result: ScanResult;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div style={{ background: '#1a3d1e', color: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
            {result.title || 'Product Identified'}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
            {[
              result.brand && `Brand: ${result.brand}`,
              result.category && `Category: ${result.category}`,
              result.confidence !== undefined && `Confidence: ${result.confidence}%`,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      {result.tags && result.tags.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {result.tags.map((tag, i) => (
            <span key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem' }}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onApply}
          style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Apply to form
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── PricePredictor ───────────────────────────────────────────────────────────
function PricePredictor({ initialPrice = '', initialExpiryDate = '', onApplyPrice }: {
  initialPrice?: string;
  initialExpiryDate?: string;
  onApplyPrice: (price: string) => void;
}) {
  const [originalPrice, setOriginalPrice] = useState(initialPrice);
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { if (initialPrice) setOriginalPrice(initialPrice); }, [initialPrice]);
  useEffect(() => { if (initialExpiryDate) setExpiryDate(initialExpiryDate); }, [initialExpiryDate]);

  const daysLeft = useMemo(() => {
    if (!expiryDate) return null;
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  }, [expiryDate]);

  const tiers = useMemo(() => {
    const price = parseFloat(originalPrice);
    if (!price || price <= 0) return null;
    let con = 0.1, rec = 0.2, agg = 0.35;
    if (daysLeft !== null) {
      if (daysLeft <= 1)      { con = 0.40; rec = 0.55; agg = 0.70; }
      else if (daysLeft <= 3) { con = 0.25; rec = 0.35; agg = 0.50; }
      else if (daysLeft <= 7) { con = 0.15; rec = 0.25; agg = 0.40; }
    }
    const fmt = (d: number) => (price * (1 - d)).toFixed(2);
    return {
      conservative: { price: fmt(con), pct: Math.round(con * 100) },
      recommended:  { price: fmt(rec), pct: Math.round(rec * 100) },
      aggressive:   { price: fmt(agg), pct: Math.round(agg * 100) },
    };
  }, [originalPrice, daysLeft]);

  return (
    <div style={{ background: '#1e1040', color: 'white', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((p) => !p); }}
        role="button"
        tabIndex={0}
      >
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Price Predictor</div>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{expanded ? '▲ Hide' : '▼ Show suggestions'}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: '12px' }}>
            Get AI-suggested discount prices based on expiry date to help reduce food waste.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Original Price (£)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          {tiers ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {([
                { key: 'conservative', label: 'Conservative', color: '#4ade80' },
                { key: 'recommended',  label: 'Recommended',  color: '#facc15' },
                { key: 'aggressive',   label: 'Aggressive',   color: '#f87171' },
              ] as const).map(({ key, label, color }) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>£{tiers[key].price}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.65, marginTop: '2px' }}>{tiers[key].pct}% off · {label}</div>
                  <button
                    type="button"
                    onClick={() => onApplyPrice(tiers[key].price)}
                    style={{ marginTop: '8px', background: 'rgba(255,255,255,0.18)', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', opacity: 0.6 }}>Enter original price above to see discount suggestions.</p>
          )}
        </div>
      )}
    </div>
  );
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
  const [scanMode, setScanMode] = useState<ScanMode>('manual');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const update = (patch: Partial<ProductForm>) => setForm((current) => ({ ...current, ...patch }));

  const applyAutofill = (result: ScanResult) => {
    const patch: Partial<ProductForm> = {};
    if (result.title)       patch.title       = result.title;
    if (result.brand)       patch.brand       = result.brand;
    if (result.weight)      patch.weight      = result.weight;
    if (result.description) patch.description = result.description;
    if (result.ingredients) patch.ingredients = result.ingredients;
    if (result.nutrition)   patch.nutrition   = result.nutrition;
    if (result.barcode)     patch.barcode     = result.barcode;
    if (result.category) {
      const matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase().includes(result.category!.toLowerCase()) ||
          result.category!.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) patch.category = matchedCat.id;
    }
    update(patch);
    setScanResult(null);
    setScanMode('manual');
    toast.success('Product details applied to form.');
  };

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
            ? tryFetchJson([backendUrl(`${apiPaths.adminProducts}${productId}/`)])
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
          fd1.append('products', productId);
          fd1.append('product_image', file);
          const fd2 = new FormData();
          fd2.append('product', productId);
          fd2.append('product_image', file);
          const fd3 = new FormData();
          fd3.append('product_id', productId);
          fd3.append('image', file);
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
        const url = extractProductImageUrl(record);
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
      fd.append('stock', form.quantity);
      fd.append('available', String(form.available));
      fd.append('description', form.description);
      fd.append('ingredients', form.ingredients);
      fd.append('nutrition', form.nutrition);

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

      const savedPayload = await res.json().catch(() => null);
      const savedRecord = savedPayload && typeof savedPayload === 'object' ? (savedPayload as Record<string, unknown>) : null;
      const savedProductId = productId ?? (savedRecord ? toStringValue(savedRecord.id) : '');

      if (savedProductId && form.images.length > 0) {
        const createdImages: { id?: string; url: string }[] = [];
        for (const file of form.images) {
          let responsePayload: unknown;
          let imageError: unknown;
          const uploadAttempts = () => {
            const fd1 = new FormData();
            fd1.append('products', savedProductId);
            fd1.append('product_image', file);
            const fd2 = new FormData();
            fd2.append('product', savedProductId);
            fd2.append('product_image', file);
            return [fd1, fd2];
          };
          for (const imageFormData of uploadAttempts()) {
            try {
              responsePayload = await createFoodcreateProductImage(imageFormData);
              break;
            } catch (error) {
              imageError = error;
            }
          }
          if (!responsePayload) throw (imageError ?? new Error('Image upload failed'));
          const item =
            Array.isArray(responsePayload) ? responsePayload[0]
              : responsePayload && typeof responsePayload === 'object' && Array.isArray((responsePayload as { results?: unknown[] }).results)
                ? (responsePayload as { results: unknown[] }).results[0]
                : responsePayload;
          const imageRecord = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
          const url = extractProductImageUrl(imageRecord);
          if (url) createdImages.push({ id: toStringValue(imageRecord.id), url });
        }

        if (createdImages.length) {
          const nextExisting = [...form.existingImages, ...createdImages];
          update({
            existingImages: nextExisting,
            images: [],
            imagePreviews: nextExisting.map((img) => img.url),
          });
        }
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

        {/* Smart Scan Panel */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
            </div>
            <h2 className={styles.sectionTitle}>Smart Fill</h2>
          </div>
          <div className={styles.sectionBody}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {([
                { mode: 'manual',  label: 'Manual Entry' },
                { mode: 'barcode', label: 'Barcode Scan' },
                { mode: 'ai',      label: 'AI Camera Scan' },
              ] as const).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setScanMode(mode); setScanResult(null); }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: scanMode === mode ? '#2d7a3a' : '#dde8de',
                    background: scanMode === mode ? '#2d7a3a' : 'transparent',
                    color: scanMode === mode ? 'white' : '#6b7b6d',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: scanMode === mode ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Autofill preview */}
            {scanResult ? (
              <AutofillPreview
                result={scanResult}
                onApply={() => applyAutofill(scanResult)}
                onDismiss={() => setScanResult(null)}
              />
            ) : null}

            {/* Scanner panels */}
            {scanMode === 'barcode' && !scanResult ? (
              <BarcodeScanner onResult={(result) => setScanResult(result)} />
            ) : null}
            {scanMode === 'ai' && !scanResult ? (
              <AICameraScanner onResult={(result) => setScanResult(result)} />
            ) : null}
            {scanMode === 'manual' ? (
              <p style={{ fontSize: '0.82rem', color: '#6b7b6d' }}>
                Fill in the form fields below manually, or switch to Barcode Scan / AI Camera Scan to auto-fill from a product image or barcode.
              </p>
            ) : null}
          </div>
        </section>

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

          <PricePredictor
            initialPrice={form.price}
            initialExpiryDate={form.expiryDate}
            onApplyPrice={(price) => update({ discountPrice: price })}
          />
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
            <label htmlFor="ingredients" className={styles.label}>
              Ingredients <span className={styles.hint}>(optional)</span>
            </label>
            <textarea
              id="ingredients"
              name="ingredients"
              rows={4}
              value={form.ingredients}
              onChange={(e) => update({ ingredients: e.target.value })}
              className={styles.textarea}
              placeholder="List the ingredients, e.g. Wheat flour, water, salt, yeast..."
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
