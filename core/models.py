# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres import fields as pg_fields


class Location(models.Model):
    address = models.CharField(max_length=255, null=False, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    place_id = models.CharField(max_length=255, null=True, blank=True)

    def __unicode__(self):
        return "Id: %s | Lat: %s | Lng: %s | Address: %s" %(
            self.id, self.latitude, self.longitude, self.address
        )

    def mini_json(self):
        return {
            'id': self.id,
            'lat': self.latitude,
            'lng': self.longitude,
            'place_id': self.place_id,
            'address': self.address,
        }


class MovieFact(models.Model):
    verbose = models.CharField(max_length=1000, null=True)
    location = models.ForeignKey('Location')
    movie = models.ForeignKey('Movie', related_name='facts', null=True)


class Movie(models.Model):
    title = models.CharField(max_length=255, null=False, unique=True, db_index=True)
    locations = models.ManyToManyField('Location', related_name='movies')
    data = pg_fields.JSONField(null=True, blank=True, default=dict)

    def __unicode__(self):
        return "Id: %s | Title: %s" % (self.id, self.title)

    def mini_json(self):
        return {
            'id': self.id,
            'title': self.title,
            'data': self.data,
            'locations': [l.mini_json() for l in self.locations.all()]
        }
