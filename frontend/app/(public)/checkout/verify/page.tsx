'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { verifyCheckoutPayment } from '@/lib/api/endpoints';

type State = 'verifying' | 'success' | 'failed';

export default function CheckoutVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('verifying');
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Stripe returns ?session_id=cs_xxx; Paystack returns ?reference=xxx or ?trxref=xxx
    const session_id = searchParams.get('session_id') ?? '';
    const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? '';

    if (!session_id && !reference) {
      setState('failed');
      setErrorMsg('No payment reference found. Please contact support.');
      return;
    }

    const displayRef = session_id || reference;
    const params = session_id ? { session_id } : { reference };

    verifyCheckoutPayment(params)
      .then((result) => {
        if (result.verified) {
          setOrderRef(result.order_ref);
          setState('success');
          // Auto-redirect to confirmation after 2s
          setTimeout(() => {
            router.push(`/order/confirmation?ref=${encodeURIComponent(result.order_ref)}`);
          }, 2000);
        } else {
          setState('failed');
          setErrorMsg('Payment could not be verified. If money was deducted, please contact support with reference: ' + displayRef);
        }
      })
      .catch(() => {
        setState('failed');
        setErrorMsg('Verification failed. Please contact support with reference: ' + displayRef);
      });
  }, [searchParams, router]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        {state === 'verifying' && (
          <>
            <Loader2 size={48} style={{ color: '#2d7a3a', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Verifying your payment…</h1>
            <p style={{ color: '#6b7b6d', fontSize: '0.9rem' }}>Please wait while we confirm your payment with Paystack.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle size={52} style={{ color: '#2d7a3a', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Payment confirmed!</h1>
            <p style={{ color: '#6b7b6d', fontSize: '0.9rem', marginBottom: '16px' }}>
              Your order <strong>{orderRef}</strong> has been placed. Redirecting to confirmation…
            </p>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={52} style={{ color: '#dc2626', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Payment verification failed</h1>
            <p style={{ color: '#6b7b6d', fontSize: '0.9rem', marginBottom: '20px' }}>{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push('/cart')}
              style={{ background: '#2d7a3a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Back to cart
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
