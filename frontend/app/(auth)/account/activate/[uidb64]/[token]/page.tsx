'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, Loader, XCircle } from 'lucide-react';
import { AccentPanel } from '@/components/auth/AccentPanel';
import { AuthBreadcrumb } from '@/components/auth/AuthBreadcrumb';
import { authActivate } from '@/lib/api/endpoints';

type Status = 'loading' | 'success' | 'error';

export default function ActivatePage({
  params,
}: {
  params: Promise<{ uidb64: string; token: string }>;
}) {
  const { uidb64, token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authActivate(uidb64, token)
      .then(() => {
        toast.success('Account activated! Please choose your role to continue.');
        setStatus('success');
        router.push('/account/choose-role');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Activation failed or link has expired.';
        setMessage(msg);
        toast.error(msg);
        setStatus('error');
      });
  }, [uidb64, token, router]);

  return (
    <div className="bf-auth-shell bf-auth-shell-login">
      <div className="bf-auth-card">
        <AccentPanel
          heading={
            status === 'success' ? (
              <><span>Account</span><br /><em>activated!</em></>
            ) : status === 'error' ? (
              <><span>Link</span><br /><em>expired</em></>
            ) : (
              <><span>Activating</span><br /><em>account…</em></>
            )
          }
          description={
            status === 'success'
              ? 'Your account is ready. Sign in to start saving on fresh food deals near you.'
              : status === 'error'
              ? 'The activation link may have already been used or has expired.'
              : 'Please wait while we verify your activation link.'
          }
        />

        <section className="bf-auth-form-panel">
          <div className="bf-auth-form-header">
            <AuthBreadcrumb current="Activate" />
            <h1>
              Email <span>verification</span>
            </h1>
          </div>

          {status === 'loading' && (
            <div className="bf-auth-success">
              <Loader className="h-10 w-10 animate-spin text-brand-primary" />
              <p>Verifying your activation link…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bf-auth-success">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p>Your email address has been confirmed and your account is now active.</p>
              <Link href="/login" className="bf-auth-link">
                Sign in to your account →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="bf-auth-success">
              <XCircle className="h-10 w-10 text-red-500" />
              <p>{message || 'This activation link is invalid or has already been used.'}</p>
              <div className="flex flex-col gap-2 mt-2">
                <Link href="/register" className="bf-auth-link">
                  Register a new account →
                </Link>
                <Link href="/login" className="bf-auth-link">
                  Back to login →
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
