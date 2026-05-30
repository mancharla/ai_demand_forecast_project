import time

CACHE = {}


def get_cache(key: str, expiry_seconds: int = 60):
    item = CACHE.get(key)

    if not item:
        return None

    value, created_at = item

    if time.time() - created_at > expiry_seconds:
        del CACHE[key]
        return None

    return value


def set_cache(key: str, value):
    CACHE[key] = (value, time.time())


def clear_cache():
    CACHE.clear()