import os
from celery import Celery


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "seafood.settings")

app = Celery("seafood")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
