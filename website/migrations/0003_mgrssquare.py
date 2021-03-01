# Generated by Django 3.1.6 on 2021-03-01 11:32

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0002_auto_20210222_1022'),
    ]

    operations = [
        migrations.CreateModel(
            name='MgrsSquare',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=9)),
                ('precision', models.SmallIntegerField()),
                ('gzd', models.CharField(max_length=3)),
                ('poly', django.contrib.gis.db.models.fields.PolygonField(srid=4326)),
            ],
        ),
    ]
