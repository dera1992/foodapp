'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, EyeOff, Mail, UserPlus } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { CustomCheckbox } from '@/components/auth/CustomCheckbox';
import { FormField } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { SocialRow } from '@/components/auth/SocialRow';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function RegisterPage() {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = useMemo(() => password1.length > 0 && password1 === password2, [password1, password2]);

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

          <form
            method="post"
            action="/account/register/"
            onSubmit={() => {
              setLoading(true);
            }}
          >
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

            <SubmitButton loading={loading} disabled={!passwordsMatch || !termsAccepted} icon={<UserPlus className="h-4 w-4" />}>
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

