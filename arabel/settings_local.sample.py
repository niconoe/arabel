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

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'something secret here'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True