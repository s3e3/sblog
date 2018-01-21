from django.conf.urls import url
from core import views
urlpatterns = [
    url(r'^$', views.default_view, name='default_view'),
    url(r'^movie/list/$', views.MovieList.as_view(), name='movie_list'),
    url(r'^movie/(?P<pk>[\d]+)/$', views.MovieDetail.as_view(), name='movie_detail'),
    url(r'^fact/location/(?P<pk>[\d]+)/$', views.FactDetail.as_view(), name='movies_at_location'),
    url(r'^location/nearby/$', views.NearByLocation.as_view(), name='nearby_locations'),
]
