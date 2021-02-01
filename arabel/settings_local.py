from arabel.settings import *

# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': 'arabel',
            'HOST': 'localhost',
        }
    }

DEBUG = True