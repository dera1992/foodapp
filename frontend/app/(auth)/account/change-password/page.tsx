'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { FormField } from '@/components/auth/FormField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = useMemo(
    () => newPassword.length > 0 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  return (
    <div className="bf-auth-shell bf-auth-shell-register">
      <div className="bf-auth-card">
        <AccentPanel
          heading={
            <>
              <span>Keep your</span>
              <br />
              account <em>secure</em>
            </>
          }
          description="Update your password regularly to protect your account and order history."
        >
          <div className="bf-auth-steps">
            <div className="bf-auth-step">
              <div className="bf-auth-step-num active">1</div>
              <div className="bf-auth-step-text">
                <strong>Enter current password</strong>
                <span>Verify account ownership</span>
              </div>
            </div>
            <div className="bf-auth-step">
              <div className="bf-auth-step-num">2</div>
              <div className="bf-auth-step-text">
                <strong>Set a stronger password</strong>
                <span>Use letters, numbers and symbols</span>
              </div>
            </div>
            <div className="bf-auth-step">
              <div className="bf-auth-step-num">3</div>
              <div className="bf-auth-step-text">
                <strong>Save changes</strong>
                <span>You may be asked to sign in again</span>
              </div>
            </div>
          </div>
        </AccentPanel>

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Register" />
            <h1>
              Change <span>password</span>
            </h1>
            <p>Use a unique password you do not use on any other site.</p>
          </div>

          <form
            method="post"
            action="/account/change-password/"
            onSubmit={() => {
              setLoading(true);
            }}
          >
            <FormField
              id="old_password"
              name="old_password"
              type={showCurrent ? 'text' : 'password'}
              label="Current password"
              placeholder="Enter current password"
              autoComplete="current-password"
              required
              rightIcon={
                <button
                  type="button"
                  className="bf-auth-icon-btn"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  aria-label="Toggle current password visibility"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div className="bf-auth-field-row">
              <div>
                <FormField
                  id="new_password1"
                  name="new_password1"
                  type={showNext ? 'text' : 'password'}
                  label="New password"
                  placeholder="Create new password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  rightIcon={
                    <button
                      type="button"
                      className="bf-auth-icon-btn"
                      onClick={() => setShowNext((prev) => !prev)}
                      aria-label="Toggle new password visibility"
                    >
                      {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <PasswordStrength password={newPassword} />
              </div>

              <FormField
                id="new_password2"
                name="new_password2"
                type={showConfirm ? 'text' : 'password'}
                label="Repeat new password"
                placeholder="Repeat new password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={confirmPassword && !passwordsMatch ? 'Passwords do not match.' : undefined}
                rightIcon={
                  <button
                    type="button"
                    className="bf-auth-icon-btn"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <SubmitButton loading={loading} disabled={!passwordsMatch} icon={<ShieldCheck className="h-4 w-4" />}>
              Update password
            </SubmitButton>
          </form>

          <p className="bf-auth-form-foot">
            <Link href="/login" className="bf-auth-link">
              Back to login
            </Link>
          </p>
          <p className="bf-auth-note">
            <KeyRound className="h-3.5 w-3.5" />
            Ready for backend password-change validation and session refresh.
          </p>
        </section>
      </div>
    </div>
  );
}

