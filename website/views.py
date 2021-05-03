import distutils
import distutils.util

from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render

from website.models import Species, Occurrence

LEON_BECKER_NAME = "Becker Leon"


def index(request):
    return render(request, 'website/index.html')


def available_species_json(request):
    dictionaries = [obj.as_dict() for obj in Species.objects.all()]
    return JsonResponse({'species': dictionaries})


def _filtered_occ(request):
    species_id = request.GET.get('speciesId')
    filter_out_leon_becker = bool(distutils.util.strtobool(request.GET.get('filterLeonBecker', "false")))
    avoid_small_squares = bool(distutils.util.strtobool(request.GET.get("noSmallSquares", "false")))

    occ = Occurrence.objects.all()
    if species_id:
        occ = occ.filter(species_id=species_id)
    if filter_out_leon_becker:
        occ = occ.exclude(station__det=LEON_BECKER_NAME).exclude(station__leg=LEON_BECKER_NAME)

    if avoid_small_squares:
        occ = occ.select_related('station___5_or_10_square')  # Perfs
    else:
        occ = occ.select_related('station__most_detailed_square')  # Perfs

    return occ


def _extract_int_request(request, param_name):
    """Returns an integer, or None if the parameter doesn't exist or is 'null' """
    val = request.GET.get(param_name, None)
    if val == '' or val == 'null' or val is None:
        return None
    else:
        return int(val)


def _extract_bool_request(request, param_name):
    """Returns an boolean (default to False). Input: 'true' | 'false' """
    val = request.GET.get(param_name, 'false')

    if val == 'true':
        return True
    else:
        return False


def occurrences_json(request):
    order = request.GET.get('order')
    limit = _extract_int_request(request, 'limit')
    page_number = _extract_int_request(request, 'page_number')

    occurrences = _filtered_occ(request).order_by(order)

    paginator = Paginator(occurrences, limit)  # Show 25 contacts per page.

    page = paginator.get_page(page_number)
    occurrences_dicts = [occ.as_dict() for occ in page.object_list]

    return JsonResponse({'results': occurrences_dicts,
                         'firstPage': page.paginator.page_range.start,
                         'lastPage': page.paginator.page_range.stop,
                         'totalResultsCount': page.paginator.count})



def squares_for_occurrences_json(request):
    """Return squares, including related stations and occurrences. Filtering is done on occ"""
    occurrences = _filtered_occ(request)

    avoid_small_squares = bool(distutils.util.strtobool(request.GET.get("noSmallSquares", "false")))

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
            if avoid_small_squares:
                square = station._5_or_10_square
            else:
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
