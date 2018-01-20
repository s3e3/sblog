# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
import re
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.views.generic.list import BaseListView
from django.views.generic.detail import BaseDetailView

from core import models as core_models
from core import utils


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

    def _build_ts_query(self, search):
        query = re.sub(r'[!\'()|&]', ' ', search).strip()
        if query:
            query = re.sub(r'\s+', ' & ', query)
            query += ':*'
        return query

    def get_queryset(self):
        search = self.request.GET.get('search')
        if not search:
            return super(MovieList, self).get_queryset()

        # TODO: find out a way to do this in a generic and better way.
        return self.model.objects.raw('''
            SELECT id, title from core_movie 
            WHERE to_tsvector(coalesce(title)) @@ to_tsquery('%s')
        ''' % self._build_ts_query(search))

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
            'result': obj.mini_json()
        })
