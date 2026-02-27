from celery import shared_task
from django.core.mail import EmailMessage


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_email_message_task(self, subject, body, from_email, recipient_list, html=False):
    email = EmailMessage(subject, body, from_email=from_email, to=recipient_list)
    if html:
        email.content_subtype = "html"
    email.send(fail_silently=False)
    return True
