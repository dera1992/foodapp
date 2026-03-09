'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { CustomCheckbox } from '@/components/auth/CustomCheckbox';
import { FormField } from '@/components/auth/FormField';
import { SocialRow } from '@/components/auth/SocialRow';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { authLogin, authMe } from '@/lib/api/endpoints';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const tokens = await authLogin(email, password);
      const days = rememberMe ? 30 : 1;

      setCookie('access_token', tokens.access, days);
      setCookie('refresh_token', tokens.refresh, 30);

      try {
        const me = await authMe(tokens.access);
        setCookie('role', me.role, days);
        setCookie('user_id', String(me.id), days);
        setCookie('user_email', me.email, days);

        toast.success('Welcome back! Signing you in…');

        if (me.role === 'pending') {
          window.location.href = '/account/choose-role';
        } else if (me.role === 'shop') {
          window.location.href = '/admin';
        } else {
          const next = new URLSearchParams(window.location.search).get('next');
          window.location.href = next || '/';
        }
      } catch {
        window.location.href = '/';
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="bf-auth-shell bf-auth-shell-login">
      <div className="bf-auth-card">
        <AccentPanel heading={<><span>Good to see</span><br />you <em>again</em></>} description="Sign in to browse today's fresh deals from local shops near you.">
          <div className="bf-auth-feature-list">
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">S</div>
              <div><strong>Save up to 90%</strong><span>On near-expiry food near you</span></div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">L</div>
              <div><strong>140+ local shops</strong><span>Verified sellers in your area</span></div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">R</div>
              <div><strong>2,400+ meals saved</strong><span>Every week across the platform</span></div>
            </div>
          </div>
        </AccentPanel>

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Login" />
            <h1>Welcome <span>back</span></h1>
            <p>Sign in to your account to continue shopping.</p>
          </div>

          <SocialRow mode="login" />
          <div className="bf-auth-divider">or continue with email</div>

          <form onSubmit={handleSubmit}>
            <FormField id="email" name="email" type="email" label="Email address" placeholder="your@email.com" autoComplete="email" required rightIcon={<Mail className="h-4 w-4" />} />
            <FormField
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              rightIcon={
                <button type="button" className="bf-auth-icon-btn" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div className="bf-auth-options-row">
              <CustomCheckbox id="remember_me" name="remember_me" checked={rememberMe} onChange={setRememberMe} label="Remember me" />
              <Link href="/account/password-reset" className="bf-auth-link">Forgot password?</Link>
            </div>

            <SubmitButton loading={loading} icon={<LogIn className="h-4 w-4" />}>
              Sign in to bunchfood
            </SubmitButton>
          </form>

          <p className="bf-auth-form-foot">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="bf-auth-link">Create one free</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
