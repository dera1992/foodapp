"""Email helpers for the order app."""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

SUPPORT_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'hello@bunchfood.com')


def send_order_invoice(order) -> bool:
    """
    Send an HTML invoice email to the customer after successful payment.
    Returns True if the email was sent, False on error.
    """
    recipient = order.contact_email or (order.user.email if order.user_id else None)
    if not recipient:
        logger.warning("send_order_invoice: no recipient for order %s", order.ref)
        return False

    order_items = order.items.select_related('item').all()

    # Compute subtotal before coupon for display
    subtotal = sum(i.get_final_price() for i in order_items)
    total = order.get_total()

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    context = {
        'order': order,
        'order_items': order_items,
        'subtotal': subtotal,
        'total': total,
        'customer_email': recipient,
        'frontend_url': frontend_url,
        'support_email': SUPPORT_EMAIL,
    }

    html_body = render_to_string('emails/order_invoice.html', context)
    subject = f"Your Bunchfood order {order.ref} is confirmed!"

    msg = EmailMultiAlternatives(
        subject=subject,
        body=(
            f"Hi {order.contact_name or recipient},\n\n"
            f"Your order {order.ref} has been confirmed.\n"
            f"Total paid: £{total}\n\n"
            f"Track your order: {frontend_url}/order/confirmation?ref={order.ref}\n\n"
            f"Thanks for shopping with Bunchfood!"
        ),
        from_email=SUPPORT_EMAIL,
        to=[recipient],
    )
    msg.attach_alternative(html_body, 'text/html')

    try:
        msg.send()
        logger.info("Invoice email sent for order %s to %s", order.ref, recipient)
        return True
    except Exception as exc:
        logger.error("Failed to send invoice for order %s: %s", order.ref, exc)
        return False
