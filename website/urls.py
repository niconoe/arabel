from django.urls import path

from website import views

urlpatterns = [
    path('', views.index, name='website-index'),

    path('api/available-species', views.available_species_json, name='available-species-json'),
    path('api/occurrences', views.occurrences_data_json, name='occurrence-data-json')
]