# Generated by Django 3.1.7 on 2021-04-26 08:35

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0008_auto_20210419_0756'),
    ]

    operations = [
        migrations.CreateModel(
            name='RedListStatus',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('access_id', models.IntegerField()),
                ('name', models.CharField(max_length=255)),
            ],
        ),
        migrations.AddField(
            model_name='species',
            name='redlist_status',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='website.redliststatus'),
        ),
    ]
