'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBudget } from '@/lib/api/endpoints';
import { QuickChips } from '@/components/budget/QuickChips';
import { VoiceButton } from '@/components/budget/VoiceButton';

type CreateBudgetForm = {
  totalBudget: number | '';
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

export function BudgetFormCard() {
  const router = useRouter();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const clearTranscriptTimerRef = useRef<number | null>(null);

  const [form, setForm] = useState<CreateBudgetForm>({ totalBudget: '' });
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const [voice, setVoice] = useState<VoiceState>({ listening: false, transcript: '', supported: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const applyAmount = useCallback((amount: number) => {
    setForm({ totalBudget: amount });
    setActiveChip(QUICK_AMOUNTS.find((chip) => chip.value === amount)?.value ?? null);
    setError('');
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      applyAmount(parsed);
      return;
    }
    setForm({ totalBudget: '' });
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
      const match = transcript.match(/(\d+(\.\d+)?)/);
      if (match) {
        applyAmount(Number.parseFloat(match[1]));
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
    try {
      const created = await createBudget({
        name: 'Shopping Budget',
        monthlyLimit: form.totalBudget as number
      });
      const target = created?.id ? `/budget-planner?budgetId=${encodeURIComponent(created.id)}` : '/budget-planner';
      router.push(target);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <article className="bf-budget-create-card">
      <header className="bf-budget-create-header">
        <h1>Set Your Shopping Budget</h1>
        <p>Tell us how much you want to spend and we&apos;ll help you stay on track.</p>
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
          AI voice assistant: try <em>&quot;set budget to 50 pounds&quot;</em> or <em>&quot;budget 120&quot;</em>.
        </p>

        {error ? (
          <p className="bf-budget-create-error">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="total_budget" value={form.totalBudget === '' ? '' : form.totalBudget} />
          <button type="submit" className="bf-budget-create-submit" disabled={!isValid || loading}>
            {loading ? 'Saving...' : 'Save Budget'}
          </button>
        </form>
      </div>
    </article>
  );
}

