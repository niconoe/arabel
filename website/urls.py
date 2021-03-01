from django.urls import path

from website import views

urlpatterns = [
    path('', views.index, name='website-index'),

    path('api/species', views.available_species_json, name='available-species-json')
]