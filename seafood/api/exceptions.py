from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    response.data = {
        "error": {
            "status_code": response.status_code,
            "detail": response.data,
            "view": context.get("view").__class__.__name__ if context.get("view") else None,
        }
    }
    return response
