'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Search, ShoppingCart } from 'lucide-react';

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: Event) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type BrowserWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    const Ctor = (window as BrowserWindow).SpeechRecognition || (window as BrowserWindow).webkitSpeechRecognition;
    if (!Ctor) return;
    const instance = new Ctor();
    instance.lang = 'en-GB';
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    setRecognition(instance);
    return () => {
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
    };
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    router.push(`/shops${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const onVoiceSearch = () => {
    if (!recognition) return;
    setListening(true);
    recognition.onresult = (event: Event) => {
      const transcript = (event as Event & { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }).results?.[0]?.[0]?.transcript ?? '';
      setQuery(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <header className="bf-header">
      <div className="bf-header-top">
        <Link href="/" className="bf-logo">bunch<span>food</span></Link>

        <form className="bf-search-bar" onSubmit={onSubmit}>
          <span className="bf-search-icon" aria-hidden="true"><Search size={14} /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search fresh deals and nearby shops"
            aria-label="Search"
          />
          <button
            type="button"
            onClick={onVoiceSearch}
            disabled={!recognition}
            title={recognition ? 'Voice search' : 'Voice search not supported in this browser'}
            aria-label="Start voice search"
            className="bf-mic-btn"
          >
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button className="bf-btn-search" type="submit">Search</button>
        </form>

        <div className="bf-header-actions">
          <Link href="/login">Login</Link>
          <Link href="/register" className="bf-btn-register">Register</Link>
          <Link prefetch={false} href="/cart" className="bf-cart-icon"><ShoppingCart size={14} /><span className="bf-cart-badge">0</span></Link>
        </div>
      </div>
    </header>
  );
}
