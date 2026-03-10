"""Abstract base class for payment gateways."""
from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    """Common interface that every payment gateway must implement."""

    @abstractmethod
    def initialize_transaction(self, email: str, amount_pence: int, ref: str, callback_url: str = '', metadata: dict | None = None) -> tuple[bool, dict | str]:
        """
        Start a payment and return the URL to redirect the customer to.

        Returns:
            (True, {'payment_url': ..., 'reference': ...}) on success
            (False, error_message_str) on failure
        """

    @abstractmethod
    def verify_payment(self, ref: str) -> tuple[bool, dict | str]:
        """
        Confirm that a payment identified by *ref* actually succeeded.

        Returns:
            (True, data_dict) on success
            (False, error_message_str) on failure
        """

    @abstractmethod
    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """Return True if the webhook request is genuinely from this gateway."""
