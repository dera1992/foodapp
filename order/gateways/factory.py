"""Factory that returns the active payment gateway instance."""
from .base import PaymentGateway


def get_gateway() -> PaymentGateway:
    """
    Returns the Stripe gateway (current active gateway for the UK market).

    To switch to Paystack in the future (African market), replace the import below
    with PaystackGateway from .paystack_gateway.
    """
    from .stripe_gateway import StripeGateway
    return StripeGateway()
