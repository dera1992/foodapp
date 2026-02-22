'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Mail, Send } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { FormField } from '@/components/auth/FormField';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function PasswordResetPage() {
  const [loading, setLoading] = useState(false);

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

          <form
            method="post"
            action="/account/password-reset/"
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
          <p className="bf-auth-note">
            <KeyRound className="h-3.5 w-3.5" />
            This page is ready for your backend reset-email flow.
          </p>
        </section>
      </div>
    </div>
  );
}

