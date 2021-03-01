from django.http import JsonResponse
from django.shortcuts import render

from website.models import Species


def index(request):
    return render(request, 'website/index.html')


def available_species_json(request):
    dictionaries = [obj.as_dict() for obj in Species.objects.all()]
    return JsonResponse({'species': dictionaries})
    #return serializers.serialize("json", )