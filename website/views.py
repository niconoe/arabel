from django.http import JsonResponse
from django.shortcuts import render

from website.models import Species, Occurrence


def index(request):
    return render(request, 'website/index.html')


def available_species_json(request):
    dictionaries = [obj.as_dict() for obj in Species.objects.all()]
    return JsonResponse({'species': dictionaries})


def _filtered_occ(request):
    species_id = request.GET.get('speciesId')

    occ = Occurrence.objects.all().select_related('station__most_detailed_square')
    if species_id:
        occ = occ.filter(species_id=species_id)

    return occ


# def occurrences_data_json(request):
#     occ = _filtered_occ(request)
#     dictionaries = [obj.as_dict() for obj in occ]
#     return JsonResponse({'occurrences': dictionaries})


def squares_for_occurences_json(request):
    """Return squares, including related stations and occurrences. Filtering is done on occ"""
    occurrences = _filtered_occ(request)

    encountered_stations = {} # k: station_id val: station dict (see model) + added occurrence list
    encountered_squares = {}  # k: square_id, val: square dict + added stations list

    for occ in occurrences:
        station = occ.station
        # 1. Keep all encountered stations + related occurrences
        occ_as_dict = occ.as_dict()
        if station.pk not in encountered_stations:
            station_dict = station.as_dict()
            station_dict['occurrences'] = [occ_as_dict]
            encountered_stations[station.pk] = station_dict

            # 2. Keep every encountered squares, with related stations
            square = station.most_detailed_square
            if square:  # Some stations don't have squares
                if square.pk not in encountered_squares:
                    square_dict = square.as_dict()
                    square_dict['stations'] = [encountered_stations[station.pk]]
                    encountered_squares[square.pk] = square_dict
                else:
                    encountered_squares[square.pk]['stations'].append(encountered_stations[station.pk])
        else:
            encountered_stations[station.pk]['occurrences'].append(occ_as_dict)


    return JsonResponse({'squares': list(encountered_squares.values())})
