from django import forms

class LatLngForm(forms.Form):
    lat = forms.FloatField(max_value=180.0, min_value=-180.0)
    lng = forms.FloatField(max_value=180.0, min_value=-180.0)
