import hashlib
import hmac

import requests
from django.conf import settings


class PayStack:
    PAYSTACK_SECRET_KEY = settings.PAYSTACK_SECRET_KEY
    base_url = 'https://api.paystack.co'

    @property
    def _headers(self):
        return {
            'Authorization': f'Bearer {self.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }

    def verify_payment(self, ref, *args, **kwargs):
        url = f'{self.base_url}/transaction/verify/{ref}'
        response = requests.get(url, headers=self._headers)
        if response.status_code == 200:
            data = response.json()
            return data['status'], data['data']
        data = response.json()
        return data['status'], data.get('message', 'Verification failed')

    def initialize_transaction(self, email, amount_kobo, ref, callback_url='', metadata=None):
        """
        Initialize a Paystack transaction.
        amount_kobo: amount in the smallest currency unit (kobo for NGN, pesewas for GHS).
        Returns (True, data_dict) on success or (False, error_message) on failure.
        """
        url = f'{self.base_url}/transaction/initialize'
        payload = {
            'email': email,
            'amount': int(amount_kobo),
            'reference': ref,
        }
        if callback_url:
            payload['callback_url'] = callback_url
        if metadata:
            payload['metadata'] = metadata

        response = requests.post(url, json=payload, headers=self._headers)
        data = response.json()
        if data.get('status'):
            return True, data['data']
        return False, data.get('message', 'Initialization failed')

    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """
        Verify that a webhook request genuinely came from Paystack.
        payload_bytes: raw request body bytes.
        signature: value of the X-Paystack-Signature header.
        """
        computed = hmac.new(
            self.PAYSTACK_SECRET_KEY.encode('utf-8'),
            payload_bytes,
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(computed, signature)
