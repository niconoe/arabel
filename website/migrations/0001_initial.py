# Generated by Django 3.1.6 on 2021-02-22 09:08

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Family',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(max_length=5, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Species',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fsc', models.CharField(max_length=50, unique=True)),
                ('scientific_name', models.CharField(max_length=255)),
                ('scientific_name_w_authorship', models.CharField(max_length=255)),
                ('vernacular_name_nl', models.CharField(blank=True, max_length=255)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='website.family')),
            ],
        ),
    ]