import re
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.utils.decorators import available_attrs
from django.conf import settings


def require_AJAX(func):
    @wraps(func, assigned=available_attrs(func))
    def _inner(*args, **kwargs):
        if not args[1].is_ajax():
            raise PermissionDenied('Only AJAX request is accepted') 
        return func(*args, **kwargs)
    return _inner


def _generate_ts_query(search):
    query = re.sub(r'[!\'()|&]', ' ', search).strip()
    if query:
        query = re.sub(r'\s+', ' & ', query)
        query += ':*'
    return query


# TODO: Find out a better way to do this thing
def get_raw_search_query(search_string):
    return '''
        SELECT id, title from core_movie
        WHERE to_tsvector(coalesce(title)) @@ to_tsquery('%s')
    ''' % _generate_ts_query(search_string)


def _generate_raw_location_query(lat, lng):
    return '''
        SELECT * FROM core_location WHERE 
        acos(sin(%s) * sin(latitude) + cos(%s) * cos(latitude) * cos(longitude - (%s))) * 6371 <= %s;
    ''' % (
        lat, 
        lat, 
        lng, 
        settings.SEARCH_RADIUS,
    )


def nearby_locations(lat, lng):
    from core.models import Location
    # TODO: can be done with Postgres GIS extension. But No Time
    return Location.objects.raw(_generate_raw_location_query(lat, lng))

