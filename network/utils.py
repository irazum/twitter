from functools import wraps

from django.http import HttpResponse


def exception_handler_decorator(func):
    @wraps(func)
    def any_views_func(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except BaseException as err:
            print(f"{err.__class__}: ", err)
            return HttpResponse(status=400)

    return any_views_func
