from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("foodCreate", "0006_product_options_and_nutrition"),
    ]

    operations = [
        migrations.AddField(
            model_name="products",
            name="brand",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="products",
            name="weight",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
