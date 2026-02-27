'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { addBudgetItem, createBudget, getNearbyShops, getProducts } from '@/lib/api/endpoints';
import { QuickChips } from '@/components/budget/QuickChips';
import { VoiceButton } from '@/components/budget/VoiceButton';
import type { Product } from '@/types/api';

type CreateBudgetForm = {
  totalBudget: number | '';
  requestText: string;
};

type QuickChip = {
  label: string;
  value: number;
};

type VoiceState = {
  listening: boolean;
  transcript: string;
  supported: boolean;
};

type ParsedRequestItem = {
  name: string;
  quantity: number;
};

type SpeechRecognitionEventLike = Event & {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

const QUICK_AMOUNTS: QuickChip[] = [
  { label: '£20', value: 20 },
  { label: '£50', value: 50 },
  { label: '£80', value: 80 },
  { label: '£120', value: 120 },
  { label: '£200', value: 200 },
  { label: '£300', value: 300 }
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

function normalizeItemName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBudgetAmount(text: string): number | null {
  if (!text.trim()) return null;
  const match = text.toLowerCase().match(/(?:budget|have|with)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:pounds?|gbp|£)?/i);
  if (!match?.[1]) return null;
  const amount = Number.parseFloat(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseItemsFromRequest(text: string): ParsedRequestItem[] {
  if (!text.trim()) return [];
  const normalized = text
    .toLowerCase()
    .replace(/\b(i have|help me buy|i need|need|want to buy|please|buy|get|for|budget|pounds|gbp)\b/g, ' ')
    .replace(/[.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = normalized
    .split(/,| and /g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const deduped = new Map<string, ParsedRequestItem>();
  chunks.forEach((chunk) => {
    let quantity = 1;
    let name = chunk;

    const digitMatch = chunk.match(/^(\d+)\s+(.+)$/);
    if (digitMatch) {
      quantity = Math.max(1, Number.parseInt(digitMatch[1], 10));
      name = digitMatch[2];
    } else {
      const wordMatch = chunk.match(/^([a-z]+)\s+(.+)$/);
      if (wordMatch && NUMBER_WORDS[wordMatch[1]]) {
        quantity = NUMBER_WORDS[wordMatch[1]];
        name = wordMatch[2];
      }
    }

    const normalizedName = normalizeItemName(name);
    if (!normalizedName) return;
    const key = normalizedName.toLowerCase();
    const existing = deduped.get(key);
    if (existing) {
      existing.quantity += quantity;
      return;
    }
    deduped.set(key, { name: normalizedName, quantity });
  });

  return [...deduped.values()].filter((item) => item.name.length > 1 && !/^\d+(\.\d+)?$/.test(item.name));
}

export function BudgetFormCard() {
  const router = useRouter();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const clearTranscriptTimerRef = useRef<number | null>(null);

  const [form, setForm] = useState<CreateBudgetForm>({ totalBudget: '', requestText: '' });
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const [voice, setVoice] = useState<VoiceState>({ listening: false, transcript: '', supported: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestWarning, setRequestWarning] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shopDistanceMap, setShopDistanceMap] = useState<Record<string, number>>({});

  const parsedItems = useMemo(() => parseItemsFromRequest(form.requestText), [form.requestText]);
  const isValid = useMemo(() => typeof form.totalBudget === 'number' && form.totalBudget > 0, [form.totalBudget]);

  useEffect(() => {
    const Ctor = (window as BrowserWindow).SpeechRecognition || (window as BrowserWindow).webkitSpeechRecognition;
    setVoice((current) => ({ ...current, supported: Boolean(Ctor) }));
    return () => {
      if (clearTranscriptTimerRef.current) {
        window.clearTimeout(clearTranscriptTimerRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProducts(), getNearbyShops()])
      .then(([productsResult, nearbyResult]) => {
        if (!active) return;
        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value.data);
        }
        if (nearbyResult.status === 'fulfilled') {
          const map: Record<string, number> = {};
          nearbyResult.value.data.forEach((shop) => {
            if (!shop.id) return;
            map[String(shop.id)] = typeof shop.distanceKm === 'number' ? shop.distanceKm : Number.POSITIVE_INFINITY;
          });
          setShopDistanceMap(map);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const normalizedProducts = useMemo(() => {
    return products.map((product) => ({
      product,
      normalizedName: normalizeItemName(product.name).toLowerCase()
    }));
  }, [products]);

  const resolveProductForItem = useCallback((itemName: string) => {
    const target = normalizeItemName(itemName).toLowerCase();
    if (!target) return { exact: null as Product | null, similar: [] as Product[] };
    const targetTokens = target.split(' ').filter(Boolean);
    const scored = normalizedProducts.map(({ product, normalizedName }) => {
      const nameTokens = normalizedName.split(' ').filter(Boolean);
      const overlap = targetTokens.filter((token) => nameTokens.includes(token)).length;
      const direct = normalizedName.includes(target) || target.includes(normalizedName);
      const distance = product.shopId ? (shopDistanceMap[String(product.shopId)] ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
      const price = Number.isFinite(product.price) ? product.price : Number.POSITIVE_INFINITY;
      const score = (direct ? 1000 : 0) + overlap * 100 - (Number.isFinite(distance) ? distance : 50) - price / 10;
      return { product, direct, overlap, distance, price, score };
    });

    const exactCandidates = scored
      .filter((entry) => entry.direct || entry.overlap >= Math.max(2, Math.ceil(targetTokens.length * 0.7)))
      .sort((a, b) => {
        const distanceA = Number.isFinite(a.distance) ? a.distance : 9999;
        const distanceB = Number.isFinite(b.distance) ? b.distance : 9999;
        if (distanceA !== distanceB) return distanceA - distanceB;
        return a.price - b.price;
      });

    const similarCandidates = scored
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.product);

    return {
      exact: exactCandidates[0]?.product ?? null,
      similar: similarCandidates
    };
  }, [normalizedProducts, shopDistanceMap]);

  const applyAmount = useCallback((amount: number) => {
    setForm((prev) => ({ ...prev, totalBudget: amount }));
    setActiveChip(QUICK_AMOUNTS.find((chip) => chip.value === amount)?.value ?? null);
    setError('');
  }, []);

  const applyRequestToForm = useCallback(() => {
    const amount = extractBudgetAmount(form.requestText);
    if (amount) {
      applyAmount(amount);
    }
  }, [applyAmount, form.requestText]);

  const handleAmountChange = useCallback((value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      applyAmount(parsed);
      return;
    }
    setForm((prev) => ({ ...prev, totalBudget: '' }));
    setActiveChip(null);
  }, [applyAmount]);

  const handleVoiceToggle = useCallback(() => {
    if (voice.listening) {
      recognitionRef.current?.stop();
      setVoice((current) => ({ ...current, listening: false }));
      return;
    }

    const Ctor = (window as BrowserWindow).SpeechRecognition || (window as BrowserWindow).webkitSpeechRecognition;
    if (!Ctor) {
      setVoice((current) => ({ ...current, supported: false }));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setVoice({ listening: true, transcript: '', supported: true });
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results ?? [])
        .map((entry) => entry?.[0]?.transcript ?? '')
        .join('')
        .trim();
      setVoice((current) => ({ ...current, transcript }));
      setForm((prev) => ({ ...prev, requestText: transcript }));
      const amount = extractBudgetAmount(transcript);
      if (amount) {
        applyAmount(amount);
      }
    };

    recognition.onend = () => {
      setVoice((current) => ({ ...current, listening: false }));
      if (clearTranscriptTimerRef.current) {
        window.clearTimeout(clearTranscriptTimerRef.current);
      }
      clearTranscriptTimerRef.current = window.setTimeout(() => {
        setVoice((current) => ({ ...current, transcript: '' }));
      }, 3000);
    };

    recognition.onerror = () => {
      setVoice((current) => ({ ...current, listening: false, transcript: '' }));
    };

    recognition.start();
  }, [applyAmount, voice.listening]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      setError('Please enter a valid budget amount greater than £0.');
      return;
    }

    setLoading(true);
    setError('');
    setRequestWarning('');
    try {
      const created = await createBudget({
        name: 'Shopping Budget',
        monthlyLimit: form.totalBudget as number
      });

      if (created?.id && parsedItems.length) {
        const unmatchedWithSuggestions: Array<{ item: string; suggestion: string }> = [];
        const unmatchedNoSuggestion: string[] = [];
        const results = await Promise.allSettled(
          parsedItems.map(async (item) => {
            const resolved = resolveProductForItem(item.name);
            if (resolved.exact) {
              return addBudgetItem(
                {
                  name: resolved.exact.name,
                  quantity: item.quantity,
                  price: resolved.exact.price ?? 0,
                  productId: String(resolved.exact.id)
                },
                created.id
              );
            }
            if (resolved.similar[0]) {
              unmatchedWithSuggestions.push({ item: item.name, suggestion: resolved.similar[0].name });
            } else {
              unmatchedNoSuggestion.push(item.name);
            }
            return addBudgetItem(
              {
                name: item.name,
                quantity: item.quantity,
                price: 0
              },
              created.id
            );
          })
        );
        const failed = results.filter((result) => result.status === 'rejected').length;
        const warnings: string[] = [];
        if (unmatchedWithSuggestions.length) {
          const formatted = unmatchedWithSuggestions
            .slice(0, 2)
            .map((entry) => `${entry.item} -> ${entry.suggestion}`)
            .join(', ');
          warnings.push(`Suggested similar products: ${formatted}.`);
        }
        if (unmatchedNoSuggestion.length) {
          warnings.push(`Unmatched items: ${unmatchedNoSuggestion.slice(0, 3).join(', ')}.`);
        }
        if (failed > 0) {
          warnings.push(`${failed} shopping list item${failed === 1 ? '' : 's'} could not be added automatically.`);
        }
        if (warnings.length) {
          setRequestWarning(warnings.join(' '));
        }
      }

      const target = created?.id ? `/budget-planner?budgetId=${encodeURIComponent(created.id)}` : '/budget-planner';
      router.push(target);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError('Please sign in to create a budget.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <article className="bf-budget-create-card">
      <header className="bf-budget-create-header">
        <h1>Set Your Shopping Budget</h1>
        <p>Type or speak your budget and what you want to buy. We&apos;ll create the budget and shopping list together.</p>
      </header>
      <div className="bf-budget-create-body">
        <label htmlFor="budget-amount" className="bf-budget-create-label">Total budget</label>
        <div className="bf-budget-create-input-wrap">
          <span className="bf-budget-create-currency">£</span>
          <input
            id="budget-amount"
            name="total_budget"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            value={form.totalBudget}
            onChange={(event) => handleAmountChange(event.target.value)}
          />
        </div>

        <span className="bf-budget-create-quick-label">Quick select</span>
        <QuickChips chips={QUICK_AMOUNTS} activeValue={activeChip} onSelect={applyAmount} />

        <VoiceButton
          listening={voice.listening}
          transcript={voice.transcript}
          supported={voice.supported}
          onToggle={handleVoiceToggle}
        />

        <p className="bf-budget-create-hint">
          Try: <em>&quot;I have 25 pounds, help me buy rice, tomatoes and fish&quot;</em>.
        </p>

        <label htmlFor="budget-request" className="bf-budget-create-label">Shopping request (optional)</label>
        <textarea
          id="budget-request"
          name="request_text"
          className="bf-budget-create-request"
          rows={3}
          placeholder="e.g. Budget 20 pounds for rice and fish"
          value={form.requestText}
          onChange={(event) => setForm((prev) => ({ ...prev, requestText: event.target.value }))}
          onBlur={applyRequestToForm}
        />
        <button type="button" className="bf-budget-create-parse-btn" onClick={applyRequestToForm}>
          Use amount from request
        </button>

        {parsedItems.length ? (
          <div className="bf-budget-create-items-preview">
            <strong>Shopping list preview</strong>
            <ul>
              {parsedItems.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <span>Qty {item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="bf-budget-create-error">
            <span aria-hidden="true">!</span>
            {error}
          </p>
        ) : null}
        {requestWarning ? <p className="bf-budget-create-warning">{requestWarning}</p> : null}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="total_budget" value={form.totalBudget === '' ? '' : form.totalBudget} />
          <input type="hidden" name="request_text" value={form.requestText} />
          <button type="submit" className="bf-budget-create-submit" disabled={!isValid || loading}>
            {loading ? 'Saving...' : parsedItems.length ? 'Create Budget + Shopping List' : 'Save Budget'}
          </button>
        </form>
      </div>
    </article>
  );
}
