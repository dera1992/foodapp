'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Heart, Mail, Mic, MicOff, Search, ShoppingCart } from 'lucide-react';
import type { Session } from '@/lib/auth/session';
import { authLogout, getCart, getThreads, getWishlist } from '@/lib/api/endpoints';

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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function formatRole(role?: Session['role']) {
  if (!role) return 'Member';
  if (role === 'shop') return 'Shop Owner';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function Navbar({ session }: { session?: Session }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<BrowserSpeechRecognition | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [messageNotice, setMessageNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const unreadCountRef = useRef(0);
  const unreadRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const isAuthenticated = Boolean(session?.isAuthenticated);

  const displayName = session?.role ? formatRole(session.role) : 'Account';
  const displayEmail = session?.email?.trim() ?? '';
  const initials = displayName.charAt(0).toUpperCase();

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

  useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    let timer: number | null = null;

    const loadUnread = async () => {
      try {
        const threads = await getThreads().then((r) => r.data);
        if (!active) return;
        const nextUnread = threads.reduce((sum, thread) => sum + (thread.unreadCount ?? 0), 0);
        setUnreadMessages(nextUnread);
        if (nextUnread > unreadCountRef.current) {
          const delta = nextUnread - unreadCountRef.current;
          setMessageNotice(delta === 1 ? 'New message received' : `${delta} new messages`);
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(() => setMessageNotice(null), 3000);
        }
        unreadCountRef.current = nextUnread;
      } catch {
        // Keep navbar polling silent.
      }
    };

    unreadRefreshRef.current = loadUnread;

    loadUnread();
    const intervalId = window.setInterval(loadUnread, 15000);
    const onRefreshUnread = () => {
      void loadUnread();
    };
    window.addEventListener('chat:refresh-unread', onRefreshUnread);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('chat:refresh-unread', onRefreshUnread);
      if (timer) window.clearTimeout(timer);
      unreadRefreshRef.current = null;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!pathname?.startsWith('/messages')) return;
    void unreadRefreshRef.current?.();
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    let active = true;

    const loadCounts = async () => {
      const [cartResult, wishlistResult] = await Promise.allSettled([getCart(), getWishlist()]);
      if (!active) return;
      const nextCart =
        cartResult.status === 'fulfilled'
          ? cartResult.value.items.length
          : 0;
      const nextWishlist = wishlistResult.status === 'fulfilled' ? wishlistResult.value.data.length : 0;
      setCartCount(nextCart);
      setWishlistCount(nextWishlist);
    };

    void loadCounts();
    const intervalId = window.setInterval(loadCounts, 15000);
    const onRefreshCounts = () => {
      void loadCounts();
    };
    window.addEventListener('cart:refresh', onRefreshCounts);
    window.addEventListener('wishlist:refresh', onRefreshCounts);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('cart:refresh', onRefreshCounts);
      window.removeEventListener('wishlist:refresh', onRefreshCounts);
    };
  }, [isAuthenticated]);

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

  const handleLogout = async () => {
    setAccountOpen(false);
    // Capture refresh token before it is cleared
    const refreshMatch = document.cookie.match(/(?:^|; )refresh_token=([^;]*)/);
    const refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : '';
    // Blacklist the refresh token on the backend (best effort)
    if (refreshToken) {
      try { await authLogout(refreshToken); } catch { /* ignore */ }
    }
    // Clear all cookies server-side via Set-Cookie headers.
    // This is the only way to remove HttpOnly cookies (e.g. Django's sessionid)
    // which JavaScript's document.cookie cannot touch.
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <header className="bf-header">
      <div className="bf-header-top">
        <div className="bf-header-row1">
          <Link href="/" className="bf-logo">bunch<span>food</span></Link>

          <div className="bf-header-actions">
            {isAuthenticated ? (
              <Link href="/messages" className="bf-message-btn" title="Messages" aria-label="Messages">
                <Mail size={18} />
                {unreadMessages > 0 ? <span className="bf-message-badge">{unreadMessages}</span> : null}
              </Link>
            ) : null}
            <Link href="/wishlist" className="bf-wishlist-btn" title="Wishlist" aria-label="Wishlist">
              <Heart size={18} />
              {wishlistCount > 0 ? <span className="bf-wishlist-badge">{wishlistCount}</span> : null}
            </Link>
            <Link prefetch={false} href="/cart" className="bf-cart-icon">
              <ShoppingCart size={14} />
              {cartCount > 0 ? <span className="bf-cart-badge">{cartCount}</span> : null}
            </Link>
            {isAuthenticated ? (
              <div className="bf-auth-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className={accountOpen ? 'bf-account-trigger open' : 'bf-account-trigger'}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((prev) => !prev)}
                >
                  <div className="bf-u-avatar">{initials}</div>
                  <span className="bf-u-name">{displayName}</span>
                  <ChevronDown size={14} className={accountOpen ? 'bf-account-caret is-open' : 'bf-account-caret'} />
                </button>
                {accountOpen ? (
                  <div className="bf-account-dropdown" role="menu">
                    <div className="bf-dd-head">
                      <div className="bf-dd-av-lg">{initials}</div>
                      <div className="bf-dd-fullname">{displayName}</div>
                      {displayEmail ? <div className="bf-dd-email">{displayEmail}</div> : null}
                      <div className="bf-dd-role"><div className="bf-dd-role-dot" />{formatRole(session?.role)}</div>
                    </div>
                    <div className="bf-dd-nav">
                      {/* Shop-specific links */}
                      {(session?.role === 'shop' || session?.role === 'admin') && (<>
                        <Link href="/admin" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📊</div><span className="bf-dd-lbl">Dashboard</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/admin/analytics" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📈</div><span className="bf-dd-lbl">Analytics</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/admin/orders" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📋</div><span className="bf-dd-lbl">Orders</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/admin/products" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📦</div><span className="bf-dd-lbl">Products</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/admin/customers" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">👥</div><span className="bf-dd-lbl">Customers</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/admin/settings" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">⚙️</div><span className="bf-dd-lbl">Settings</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                      </>)}

                      {/* Dispatcher-specific links */}
                      {session?.role === 'dispatcher' && (<>
                        <Link href="/dispatcher/dashboard" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📊</div><span className="bf-dd-lbl">Dashboard</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/dispatcher/profile" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">👤</div><span className="bf-dd-lbl">My Profile</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/dispatcher/settings" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">⚙️</div><span className="bf-dd-lbl">Settings</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                      </>)}

                      {/* Customer-specific links */}
                      {session?.role === 'customer' && (<>
                        <Link href="/account/analytics" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📊</div><span className="bf-dd-lbl">Dashboard</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/account/orders" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">📋</div><span className="bf-dd-lbl">My Orders</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/wishlist" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">❤️</div><span className="bf-dd-lbl">Wishlist</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                        <Link href="/account/settings" className="bf-dd-item" role="menuitem" onClick={() => setAccountOpen(false)}>
                          <div className="bf-dd-ic">⚙️</div><span className="bf-dd-lbl">Settings</span><ChevronRightIcon className="bf-dd-arr" />
                        </Link>
                      </>)}

                      <div className="bf-dd-sep" />
                      <button type="button" className="bf-dd-item bf-dd-item-out" role="menuitem" onClick={handleLogout}>
                        <div className="bf-dd-ic">🚪</div>
                        <span className="bf-dd-lbl">Log Out</span>
                        <ChevronRightIcon className="bf-dd-arr" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link href="/login" className="bf-login-link">Login</Link>
                <Link href="/register" className="bf-btn-register">Register</Link>
              </>
            )}
          </div>
        </div>
        {messageNotice ? <div className="bf-message-toast">{messageNotice}</div> : null}

        <form className="bf-header-row2" onSubmit={onSubmit}>
          <div className="bf-search-bar">
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
          </div>
          <button className="bf-btn-search" type="submit">Search</button>
        </form>
      </div>
    </header>
  );
}
