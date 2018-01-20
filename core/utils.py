from functools import wraps
from django.core.exceptions import PermissionDenied
from django.utils.decorators import available_attrs

def require_AJAX(func):
    @wraps(func, assigned=available_attrs(func))
    def _inner(*args, **kwargs):
        if not args[1].is_ajax():
            raise PermissionDenied('Only AJAX request is accepted') 
        return func(*args, **kwargs)
    return _inner
