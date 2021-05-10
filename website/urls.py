from django.urls import path

from website import views

urlpatterns = [
    path('', views.index, name='website-index'),
    path('about', views.about, name='website-about'),

    path('api/available-species', views.available_species_json, name='available-species-json'),
    path('api/squares_for_occurrences', views.squares_for_occurrences_json, name='squares-for-occurrences-json'),
    path('api/occurrences', views.occurrences_json, name='occurrences-json'),
    path('api/counters', views.counters_json, name='counters-json')
]