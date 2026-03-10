"""Stripe Checkout Session gateway implementation (GBP / UK market)."""
import logging

import stripe
from django.conf import settings

from .base import PaymentGateway

logger = logging.getLogger(__name__)


class StripeGateway(PaymentGateway):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def initialize_transaction(self, email: str, amount_pence: int, ref: str, callback_url: str = '', metadata: dict | None = None) -> tuple[bool, dict | str]:
        """
        Create a Stripe Checkout Session and return the hosted URL.
        amount_pence is the amount in the smallest currency unit (pence for GBP).
        """
        success_url = callback_url or f"{settings.FRONTEND_URL}/checkout/verify"
        cancel_url = f"{settings.FRONTEND_URL}/checkout"

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'gbp',
                        'unit_amount': amount_pence,
                        'product_data': {'name': f'Order {ref}'},
                    },
                    'quantity': 1,
                }],
                mode='payment',
                customer_email=email,
                client_reference_id=ref,
                success_url=f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=cancel_url,
                metadata={'order_ref': ref, **(metadata or {})},
            )
            return True, {'payment_url': session.url, 'session_id': session.id, 'reference': ref}
        except stripe.StripeError as exc:
            logger.error("Stripe initialization failed for ref=%s: %s", ref, exc)
            return False, str(exc)

    def verify_payment(self, ref: str) -> tuple[bool, dict | str]:
        """Verify payment by Stripe Checkout Session ID (stored as the order ref when using Stripe)."""
        try:
            # ref may be a session_id (starts with 'cs_') or the order ref stored in metadata
            if ref.startswith('cs_'):
                session = stripe.checkout.Session.retrieve(ref)
            else:
                # Look up by client_reference_id — list recent sessions (no server-side search by ref directly)
                sessions = stripe.checkout.Session.list(limit=10)
                session = next((s for s in sessions.auto_paging_iter() if s.client_reference_id == ref), None)
                if session is None:
                    return False, 'Session not found'

            if session.payment_status == 'paid':
                return True, {'session_id': session.id, 'amount': session.amount_total}
            return False, f"Payment status: {session.payment_status}"
        except stripe.StripeError as exc:
            logger.error("Stripe verify_payment failed for ref=%s: %s", ref, exc)
            return False, str(exc)

    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        try:
            stripe.WebhookSignature.verify_header(
                payload_bytes.decode('utf-8'),
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
            return True
        except stripe.SignatureVerificationError:
            return False
