#!/bin/sh
set -e

python manage.py migrate --no-input
python manage.py collectstatic --no-input

exec gunicorn arabel.wsgi --bind 0.0.0.0:8000 --workers 2
