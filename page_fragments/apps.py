from django.apps import AppConfig

# This is a simple Django app that allows to define simple page fragments in templates (a piece of Markdown, per
# language) and configure them in the Django Admin.
#
# This simple approach allows us to avoid bloated CMSes
# This app relies on Django-Markdownx
#
# Setup:
#   - add to `INSTALLED_APPS`
#   - set the PAGE_FRAGMENTS_FALLBACK_LANGUAGE settings (the language code that will be used if a page fragment has not
#     been translated to the requested language yet.
#   - make sure 'django.middleware.locale.LocaleMiddleware' is listed in the MIDDLEWARE settings.
#
# Mini-tutorial
# =============
#
# 1. Add a page fragment in your template:
#
#  {% load page_fragments %}
#  ...
#  <div>{% get_page_fragment 'welcome' %}</div>
#
# 2. In the Admin, create a fragment with the same name ('welcome') and fill the markdown text. You can also create the
#    entries via other means: python console, fixtures, ... (PageFragment is just a regular Django model)
#
#
# - To add support for a language, you need to add a new field to the PageFragment model.

class PageFragmentsConfig(AppConfig):
    name = 'page_fragments'
