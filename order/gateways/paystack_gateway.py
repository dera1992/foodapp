"""Paystack gateway implementation (NGN / African market)."""
from order.paystack import PayStack

from .base import PaymentGateway


class PaystackGateway(PaymentGateway):
    def __init__(self):
        self._ps = PayStack()

    def initialize_transaction(self, email: str, amount_pence: int, ref: str, callback_url: str = '', metadata: dict | None = None) -> tuple[bool, dict | str]:
        ok, result = self._ps.initialize_transaction(
            email=email,
            amount_kobo=amount_pence,  # for Paystack caller passes kobo
            ref=ref,
            callback_url=callback_url,
            metadata=metadata,
        )
        if ok:
            return True, {'payment_url': result['authorization_url'], 'reference': ref}
        return False, result

    def verify_payment(self, ref: str) -> tuple[bool, dict | str]:
        ok, data = self._ps.verify_payment(ref)
        if ok and isinstance(data, dict) and data.get('status') == 'success':
            return True, data
        return False, str(data)

    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        return self._ps.verify_webhook_signature(payload_bytes, signature)
