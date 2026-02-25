'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Mail, Send } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { FormField } from '@/components/auth/FormField';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { authPasswordReset } from '@/lib/api/endpoints';

export default function PasswordResetPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await authPasswordReset(form.get('email') as string);
      toast.success('Reset link sent! Check your inbox.');
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bf-auth-shell bf-auth-shell-login">
        <div className="bf-auth-card">
          <AccentPanel heading={<><span>Check your</span><br /><em>inbox!</em></>} description="We sent a secure reset link to your email address." />
          <section className="bf-auth-form-panel">
            <div className="bf-auth-form-header">
              <AuthBreadcrumb current="Login" />
              <h1>Email <span>sent</span></h1>
            </div>
            <div className="bf-auth-success">
              <CheckCircle className="h-10 w-10" />
              <p>If an account with that email exists, you will receive a password reset link shortly. Check your spam folder if you don&apos;t see it.</p>
              <Link href="/login" className="bf-auth-link">Back to login →</Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bf-auth-shell bf-auth-shell-login">
      <div className="bf-auth-card">
        <AccentPanel
          heading={
            <>
              <span>Forgot your</span>
              <br />
              <em>password</em>?
            </>
          }
          description="No problem. Enter your email and we will send a secure reset link."
        >
          <div className="bf-auth-feature-list">
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">1</div>
              <div>
                <strong>Enter your account email</strong>
                <span>Use the email you signed up with</span>
              </div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">2</div>
              <div>
                <strong>Check your inbox</strong>
                <span>Follow the reset link we send</span>
              </div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">3</div>
              <div>
                <strong>Create a new password</strong>
                <span>Sign back in with your updated password</span>
              </div>
            </div>
          </div>
        </AccentPanel>

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Login" />
            <h1>
              Reset <span>password</span>
            </h1>
            <p>Enter your email address and we will send reset instructions.</p>
          </div>

          {error && <div className="bf-auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="your@email.com"
              autoComplete="email"
              required
              rightIcon={<Mail className="h-4 w-4" />}
            />

            <SubmitButton loading={loading} icon={<Send className="h-4 w-4" />}>
              Send reset link
            </SubmitButton>
          </form>

          <p className="bf-auth-form-foot">
            <Link href="/login" className="bf-auth-link inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

