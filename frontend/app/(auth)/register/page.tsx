'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { CustomCheckbox } from '@/components/auth/CustomCheckbox';
import { FormField } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { SocialRow } from '@/components/auth/SocialRow';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ApiError } from '@/lib/api/client';
import { authCheckEmail, authRegister, extractDRFFieldErrors } from '@/lib/api/endpoints';

export default function RegisterPage() {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailChecking, setEmailChecking] = useState(false);

  const passwordsMatch = useMemo(() => password1.length > 0 && password1 === password2, [password1, password2]);

  // Clear inline email error as soon as the user starts editing the field
  const onEmailChange = () => {
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
  };

  // Check email availability when the user leaves the email field
  const onEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailChecking(true);
    try {
      const result = await authCheckEmail(email);
      if (!result.available) {
        const msg = result.detail ?? 'An account with this email already exists.';
        setFieldErrors((prev) => ({ ...prev, email: msg }));
        toast.error(msg, { id: 'email-taken' });
      }
    } catch {
      // silently ignore network errors on the pre-check
    } finally {
      setEmailChecking(false);
    }
  };

  // Toast when user leaves the confirm-password field and passwords don't match
  const onPassword2Blur = () => {
    if (password2 && !passwordsMatch) {
      toast.error('Passwords do not match. Please re-enter your password.');
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast.error('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions to create your account.');
      return;
    }

    setLoading(true);
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    try {
      await authRegister({
        email: form.get('email') as string,
        password: password1,
      });
      toast.success('Account created! Check your email to activate it.');
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(msg);
      // Highlight the exact field the server complained about
      if (err instanceof ApiError && err.details) {
        setFieldErrors(extractDRFFieldErrors(err.details));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bf-auth-shell bf-auth-shell-register">
        <div className="bf-auth-card">
          <AccentPanel heading={<><span>Almost</span><br /><em>there!</em></>} description="Check your inbox to activate your account." />
          <section className="bf-auth-form-panel">
            <div className="bf-auth-form-header">
              <AuthBreadcrumb current="Register" />
              <h1>Check your <span>email</span></h1>
            </div>
            <div className="bf-auth-success">
              <CheckCircle className="h-10 w-10" />
              <p>We sent an activation link to your email address. Click the link to activate your account and start shopping.</p>
              <Link href="/login" className="bf-auth-link">Back to login →</Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bf-auth-shell bf-auth-shell-register">
      <div className="bf-auth-card">
        <AccentPanel
          heading={
            <>
              <span>Join the</span>
              <br />
              <em>food rescue</em>
              <br />
              movement
            </>
          }
          description="Create a free account and start saving on near-expiry food from shops near you."
        >
          <div className="bf-auth-steps">
            <div className="bf-auth-step">
              <div className="bf-auth-step-num active">1</div>
              <div className="bf-auth-step-text">
                <strong>Create your account</strong>
                <span>Takes less than 2 minutes</span>
              </div>
            </div>
            <div className="bf-auth-step">
              <div className="bf-auth-step-num">2</div>
              <div className="bf-auth-step-text">
                <strong>Find shops near you</strong>
                <span>Share your location for local deals</span>
              </div>
            </div>
            <div className="bf-auth-step">
              <div className="bf-auth-step-num">3</div>
              <div className="bf-auth-step-text">
                <strong>Start saving</strong>
                <span>Up to 90% off near-expiry food</span>
              </div>
            </div>
          </div>
        </AccentPanel>

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Register" />
            <h1>
              Create your <span>account</span>
            </h1>
            <p>Join thousands saving on fresh food every day.</p>
          </div>

          <SocialRow mode="register" />
          <div className="bf-auth-divider">or register with email</div>

          <form onSubmit={handleSubmit}>
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="your@email.com"
              autoComplete="email"
              required
              onChange={onEmailChange}
              onBlur={onEmailBlur}
              error={fieldErrors.email}
              rightIcon={emailChecking
                ? <span className="bf-auth-checking" aria-label="Checking email…" />
                : <Mail className="h-4 w-4" />}
            />

            <div className="bf-auth-field-row">
              <div>
                <FormField
                  id="password1"
                  name="password1"
                  type={showPwd1 ? 'text' : 'password'}
                  label="Password"
                  placeholder="Create password"
                  autoComplete="new-password"
                  required
                  value={password1}
                  onChange={(event) => setPassword1(event.target.value)}
                  error={fieldErrors.password}
                  rightIcon={
                    <button type="button" className="bf-auth-icon-btn" onClick={() => setShowPwd1((prev) => !prev)} aria-label="Toggle password visibility">
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
                label="Repeat Password"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
                value={password2}
                onChange={(event) => setPassword2(event.target.value)}
                onBlur={onPassword2Blur}
                error={password2 && !passwordsMatch ? 'Passwords do not match.' : undefined}
                rightIcon={
                  <button type="button" className="bf-auth-icon-btn" onClick={() => setShowPwd2((prev) => !prev)} aria-label="Toggle password visibility">
                    {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <CustomCheckbox
              id="terms"
              name="terms"
              checked={termsAccepted}
              onChange={setTermsAccepted}
              required
              label={
                <>
                  I agree to the{' '}
                  <Link href="/terms/" className="bf-auth-link">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy/" className="bf-auth-link">
                    Privacy Policy
                  </Link>
                </>
              }
            />

            <SubmitButton loading={loading} disabled={loading} icon={<UserPlus className="h-4 w-4" />}>
              Create my free account
            </SubmitButton>
          </form>

          <p className="bf-auth-form-foot">
            Already have an account?{' '}
            <Link href="/login" className="bf-auth-link">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
