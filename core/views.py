# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
import re
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, Http404
from django.conf import settings
from django.views.generic.list import BaseListView
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import FormMixin
from django.views.generic.base import View
from django.template import Context, Template
from django.template.loader import render_to_string
from core import models as core_models
from core import utils
from core import forms


# Create your views here.
def default_view(request):
    return render(
        request, 
        "core/index.html", 
        {
            'DEFAULT_LATITUDE': settings.DEFAULT_LATITUDE,
            'DEFAULT_LONGITUDE': settings.DEFAULT_LONGITUDE,
            'DEFAULT_ZOOM': settings.DEFAULT_ZOOM,
        }
    )

class MovieList(BaseListView):
    model = core_models.Movie

    def get_queryset(self):
        search = self.request.GET.get('search')
        if not search:
            return super(MovieList, self).get_queryset()

        return self.model.objects.raw(
            utils.get_raw_search_query(search)
        )

    @utils.require_AJAX
    def get(self, request, *args, **kargs):
        obj_list = self.get_queryset()
        return JsonResponse({
            'results': [{'key': m.title, 'value': m.id} for m in obj_list]
        })


class MovieDetail(BaseDetailView):
    model = core_models.Movie

    @utils.require_AJAX
    def get(self, request, *args, **kargs):
        obj = self.get_object()
        return JsonResponse({
            'result': obj.mini_json(),
        })


# Movie Facts at a given location
# if 'movie_id' in get params then return all facts for that movie at that location
# else return facts for all movies at that location
class FactDetail(BaseDetailView):
    model = core_models.Location

    @utils.require_AJAX
    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        movie_id = self.request.GET.get('movie_id')

        if movie_id:
            query = obj.movies.filter(id=movie_id)
        else:
            query = obj.movies.all()
        
        results = [{
            'movie': movie.mini_json(),
            'facts': [
                fact.mini_json() for fact in movie.facts.filter(location=obj).exclude(verbose='')
            ]
        } for movie in query]

        return JsonResponse({
            'template': render_to_string(
                'core/movie.html', 
                {'results': results}
            )
        })


# Return Nearby Locations given a location id
# Radius is defined in settings file
class NearByLocation(FormMixin, View):
    form_class = forms.LatLngForm

    def get_form_kwargs(self):
        return {
            'data': self.request.GET
        }

    @utils.require_AJAX
    def get(self, request, *args, **kwargs):
        form = self.get_form()

        if form.is_valid():
            return JsonResponse({
                'results': [loc.mini_json() for loc in utils.nearby_locations(**form.cleaned_data)]
            })
        else:
            return JsonResponse({'success': False})
