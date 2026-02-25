'use client';

import Link from 'next/link';
import { useMemo, use, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { FormField } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { authPasswordResetConfirm } from '@/lib/api/endpoints';

export default function PasswordResetConfirmPage({
  params,
}: {
  params: Promise<{ uidb64: string; token: string }>;
}) {
  const { uidb64, token } = use(params);

  const [loading, setLoading] = useState(false);
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = useMemo(
    () => password1.length > 0 && password1 === password2,
    [password1, password2]
  );

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    setError(null);
    setLoading(true);
    try {
      await authPasswordResetConfirm(uidb64, token, password1);
      toast.success('Password reset! You can now sign in with your new password.');
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'This reset link is invalid or has expired. Please request a new one.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bf-auth-shell bf-auth-shell-login">
        <div className="bf-auth-card">
          <AccentPanel
            heading={
              <>
                <span>All</span>
                <br />
                <em>done!</em>
              </>
            }
            description="Your password has been reset. You can now sign in with your new password."
          />
          <section className="bf-auth-form-panel">
            <div className="bf-auth-form-header">
              <AuthBreadcrumb current="Login" />
              <h1>
                Password <span>reset</span>
              </h1>
            </div>
            <div className="bf-auth-success">
              <CheckCircle className="h-10 w-10" />
              <p>Your password has been reset successfully. Sign in with your new password to continue.</p>
              <Link href="/login" className="bf-auth-link">
                Sign in now →
              </Link>
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
              <span>Set your</span>
              <br />
              new <em>password</em>
            </>
          }
          description="Choose a strong password to keep your account secure."
        >
          <div className="bf-auth-feature-list">
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">✓</div>
              <div>
                <strong>At least 8 characters</strong>
                <span>Longer is always stronger</span>
              </div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">✓</div>
              <div>
                <strong>Mix letters and numbers</strong>
                <span>Add symbols for extra security</span>
              </div>
            </div>
            <div className="bf-auth-feature-item">
              <div className="bf-auth-feature-icon">✓</div>
              <div>
                <strong>Unique to this site</strong>
                <span>Don&apos;t reuse passwords from elsewhere</span>
              </div>
            </div>
          </div>
        </AccentPanel>

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Login" />
            <h1>
              New <span>password</span>
            </h1>
            <p>Enter and confirm your new password below.</p>
          </div>

          {error && <div className="bf-auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div>
              <FormField
                id="password1"
                name="password1"
                type={showPwd1 ? 'text' : 'password'}
                label="New password"
                placeholder="Create new password"
                autoComplete="new-password"
                required
                value={password1}
                onChange={(event) => setPassword1(event.target.value)}
                rightIcon={
                  <button
                    type="button"
                    className="bf-auth-icon-btn"
                    onClick={() => setShowPwd1((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showPwd1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <PasswordStrength password={password1} />
            </div>

            <FormField
              id="password2"
              name="password2"
              type={showPwd2 ? 'text' : 'password'}
              label="Confirm new password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
              error={password2 && !passwordsMatch ? 'Passwords do not match.' : undefined}
              rightIcon={
                <button
                  type="button"
                  className="bf-auth-icon-btn"
                  onClick={() => setShowPwd2((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <SubmitButton
              loading={loading}
              disabled={!passwordsMatch}
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              Set new password
            </SubmitButton>
          </form>

          <p className="bf-auth-form-foot">
            <Link href="/account/password-reset" className="bf-auth-link">
              Request a new reset link
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
