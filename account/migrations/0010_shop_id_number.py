from django.db import migrations, models
import string
import secrets


def populate_shop_id_numbers(apps, schema_editor):
    Shop = apps.get_model("account", "Shop")
    alphabet = string.ascii_uppercase + string.digits

    for shop in Shop.objects.filter(id_number__isnull=True).iterator():
        while True:
            candidate = "".join(secrets.choice(alphabet) for _ in range(10))
            if not Shop.objects.filter(id_number=candidate).exists():
                shop.id_number = candidate
                shop.save(update_fields=["id_number"])
                break

    for shop in Shop.objects.filter(id_number="").iterator():
        while True:
            candidate = "".join(secrets.choice(alphabet) for _ in range(10))
            if not Shop.objects.filter(id_number=candidate).exists():
                shop.id_number = candidate
                shop.save(update_fields=["id_number"])
                break


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0009_shop_latitude_longitude"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="id_number",
            field=models.CharField(blank=True, editable=False, max_length=10, null=True),
        ),
        migrations.RunPython(populate_shop_id_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="shop",
            name="id_number",
            field=models.CharField(blank=True, editable=False, max_length=10, unique=True),
        ),
    ]
