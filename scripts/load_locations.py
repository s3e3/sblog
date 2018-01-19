import os
import sys
import csv
import path
import requests
import json

SETTINGS_FILE_FOLDER = path.path(__file__).parent.parent.abspath()
sys.path.append(SETTINGS_FILE_FOLDER)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", 'base.settings')

import django  # noqa
django.setup()
from django.conf import settings

from core import models as core_models

GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
CSV_FILE_LOCATION = '/tmp/film_locations.csv'

def _get_location(address):
    if not address:
        return '', False

    try:
        return core_models.Location.objects.get(address=address), True
    except core_models.Location.DoesNotExist:
        data = {
            'key': settings.GEOCODE_API_KEY,
            'address': "%s, San Francisco, California" % address
        }
        response = requests.get(GEOCODE_URL, params=data)
        data = json.loads(response.text)
        if response.ok and data.get('status') == 'OK':
            result = data.get('results')[0]
            print "== creating location =="
            return core_models.Location.objects.create(
                address=address,
                place_id=result.get('place_id'),
                latitude=result['geometry']['location']['lat'],
                longitude=result['geometry']['location']['lng']
            ), True
    return '', False

def _get_movie(title, data):
    location, found = _get_location(data.pop('Locations'))

    if not found:
        return False

    fact, _ = core_models.MovieFact.objects.get_or_create(
        location=location,
        verbose=data.pop('Fun Facts')
    )
    movie, created = core_models.Movie.objects.get_or_create(
        title=title,
        defaults={
            'data': data
        }
    )
    if created: print("== Movie Created ==")
    movie.locations.add(location)
    movie.facts.add(fact)


def process_row(row):
    title = row.pop('\xef\xbb\xbfTitle')

    movie = _get_movie(title, row)


def main():
    with open(CSV_FILE_LOCATION, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile)
        i = 0
        for row in csvreader:
            print '--------------------- ', i
            process_row(row)
            i += 1

if __name__ == '__main__':
    main()
