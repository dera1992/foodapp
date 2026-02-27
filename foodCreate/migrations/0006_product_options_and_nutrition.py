from django.db import migrations, models
import django.db.models.deletion


def _norm(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def forwards(apps, schema_editor):
    Products = apps.get_model("foodCreate", "Products")
    LabelOption = apps.get_model("foodCreate", "LabelOption")
    StatusOption = apps.get_model("foodCreate", "StatusOption")
    DeliveryMethod = apps.get_model("foodCreate", "DeliveryMethod")
    DayOption = apps.get_model("foodCreate", "DayOption")

    label_seed = {
        "p": "onsale",
        "s": "secondary",
        "new": "New",
        "hot": "Hot deal",
        "last_few": "Last few",
        "organic": "Organic",
    }
    status_seed = {
        "draft": "Draft",
        "available": "Available",
        "active": "Active",
        "out_of_stock": "Out of stock",
        "unavailable": "Unavailable",
        "expired": "Expired",
    }
    delivery_seed = {
        "now": "Now",
        "delivery": "Delivery available",
        "pickup": "Pickup only",
        "both": "Delivery & Pickup",
    }
    day_seed = {
        "now": "Now",
        "1-2days": "1-2 days",
        "2-3days": "2-3 days",
        "3-4days": "3-4 days",
        "4-5days": "4-5 days",
        "5-6days": "5-6 days",
    }

    for code, name in label_seed.items():
        LabelOption.objects.get_or_create(code=code, defaults={"name": name})
    for code, name in status_seed.items():
        StatusOption.objects.get_or_create(code=code, defaults={"name": name})
    for code, name in delivery_seed.items():
        DeliveryMethod.objects.get_or_create(code=code, defaults={"name": name})
    for code, name in day_seed.items():
        DayOption.objects.get_or_create(code=code, defaults={"name": name})

    for product in Products.objects.all().iterator():
        old_label = _norm(getattr(product, "label", None))
        old_status = _norm(getattr(product, "status", None))
        old_delivery = _norm(getattr(product, "delivery", None))

        if old_label:
            label_obj, _ = LabelOption.objects.get_or_create(
                code=old_label,
                defaults={"name": label_seed.get(old_label, old_label.replace("_", " ").title())},
            )
            product.label_fk_id = label_obj.id

        if old_status:
            status_obj, _ = StatusOption.objects.get_or_create(
                code=old_status,
                defaults={"name": status_seed.get(old_status, old_status.replace("_", " ").title())},
            )
            product.status_fk_id = status_obj.id

        if old_delivery:
            delivery_obj, _ = DeliveryMethod.objects.get_or_create(
                code=old_delivery,
                defaults={"name": delivery_seed.get(old_delivery, old_delivery.replace("_", " ").title())},
            )
            product.delivery_fk_id = delivery_obj.id

            if old_delivery in day_seed:
                day_obj, _ = DayOption.objects.get_or_create(
                    code=old_delivery,
                    defaults={"name": day_seed[old_delivery]},
                )
                product.delivery_time_id = day_obj.id

        product.save(update_fields=["label_fk", "status_fk", "delivery_fk", "delivery_time"])


def backwards(apps, schema_editor):
    Products = apps.get_model("foodCreate", "Products")

    for product in Products.objects.select_related("label_fk", "status_fk", "delivery_fk").all().iterator():
        product.label = product.label_fk.code if product.label_fk else None
        product.status = product.status_fk.code if product.status_fk else None
        product.delivery = product.delivery_fk.code if product.delivery_fk else None
        product.save(update_fields=["label", "status", "delivery"])


class Migration(migrations.Migration):

    dependencies = [
        ("foodCreate", "0005_products_barcode"),
    ]

    operations = [
        migrations.CreateModel(
            name="DayOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.CreateModel(
            name="DeliveryMethod",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.CreateModel(
            name="LabelOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.CreateModel(
            name="StatusOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.AddField(
            model_name="products",
            name="delivery_fk",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="foodCreate.deliverymethod"),
        ),
        migrations.AddField(
            model_name="products",
            name="delivery_time",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="foodCreate.dayoption"),
        ),
        migrations.AddField(
            model_name="products",
            name="label_fk",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="foodCreate.labeloption"),
        ),
        migrations.AddField(
            model_name="products",
            name="nutrition",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="products",
            name="status_fk",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="foodCreate.statusoption"),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RenameField(model_name="products", old_name="label", new_name="label_old"),
        migrations.RenameField(model_name="products", old_name="status", new_name="status_old"),
        migrations.RenameField(model_name="products", old_name="delivery", new_name="delivery_old"),
        migrations.RemoveField(model_name="products", name="label_old"),
        migrations.RemoveField(model_name="products", name="status_old"),
        migrations.RemoveField(model_name="products", name="delivery_old"),
        migrations.RenameField(model_name="products", old_name="label_fk", new_name="label"),
        migrations.RenameField(model_name="products", old_name="status_fk", new_name="status"),
        migrations.RenameField(model_name="products", old_name="delivery_fk", new_name="delivery"),
    ]
