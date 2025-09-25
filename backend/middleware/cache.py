"""
Cache Middleware for FastAPI

Provides HTTP response caching to improve performance by storing
frequently requested data in memory.
"""

import json
import hashlib
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio


class InMemoryCache:
    """Simple in-memory cache with TTL support."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cleanup_task = None
        self._start_cleanup_task()

    def _start_cleanup_task(self):
        """Start background task to clean expired entries."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_expired())

    async def _cleanup_expired(self):
        """Background task to remove expired cache entries."""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                current_time = datetime.utcnow()
                expired_keys = []

                for key, data in self._cache.items():
                    if current_time > data['expires_at']:
                        expired_keys.append(key)

                for key in expired_keys:
                    del self._cache[key]

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Cache cleanup error: {e}")

    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key not in self._cache:
            return None

        data = self._cache[key]
        if datetime.utcnow() > data['expires_at']:
            del self._cache[key]
            return None

        return data['value']

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Cache value with TTL."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        }

    def delete(self, key: str):
        """Delete cached value."""
        if key in self._cache:
            del self._cache[key]

    def clear(self):
        """Clear all cached values."""
        self._cache.clear()

    def stats(self):
        """Get cache statistics."""
        total_entries = len(self._cache)
        current_time = datetime.utcnow()
        expired_entries = sum(1 for data in self._cache.values()
                            if current_time > data['expires_at'])

        return {
            'total_entries': total_entries,
            'active_entries': total_entries - expired_entries,
            'expired_entries': expired_entries
        }


# Global cache instance
cache = InMemoryCache()


class CacheMiddleware(BaseHTTPMiddleware):
    """
    HTTP Response Cache Middleware

    Caches GET requests for specified endpoints to improve performance.
    Cache keys are generated from URL path and query parameters.
    """

    def __init__(self, app, cache_ttl_seconds: int = 300):
        super().__init__(app)
        self.cache_ttl = cache_ttl_seconds

        # Only cache these endpoints
        self.cacheable_paths = {
            '/api/teams': 600,      # Cache teams for 10 minutes
            '/api/players': 600,    # Cache players for 10 minutes
            '/api/gameweeks': 300,  # Cache gameweeks for 5 minutes
            '/api/fixtures': 120,   # Cache fixtures for 2 minutes
            '/api/users': 180,      # Cache users for 3 minutes
        }

    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request URL and query parameters."""
        # Include path and sorted query parameters
        query_string = str(sorted(request.query_params.items()))
        cache_data = f"{request.url.path}?{query_string}"

        # Generate hash for consistent key length
        return hashlib.md5(cache_data.encode()).hexdigest()

    def _is_cacheable(self, request: Request) -> tuple[bool, int]:
        """Check if request should be cached and get TTL."""
        if request.method != 'GET':
            return False, 0

        path = request.url.path

        # Check exact path matches
        if path in self.cacheable_paths:
            return True, self.cacheable_paths[path]

        # Check prefix matches (for endpoints with IDs)
        for cacheable_path, ttl in self.cacheable_paths.items():
            if path.startswith(cacheable_path + '/'):
                return True, ttl

        return False, 0

    async def dispatch(self, request: Request, call_next):
        """Handle caching logic."""
        is_cacheable, ttl = self._is_cacheable(request)

        if not is_cacheable:
            return await call_next(request)

        cache_key = self._generate_cache_key(request)

        # Try to get cached response
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            # Return cached response
            response = Response(
                content=cached_response['body'],
                status_code=cached_response['status_code'],
                headers=cached_response['headers'],
                media_type=cached_response.get('media_type')
            )

            # Add cache hit header
            response.headers['X-Cache'] = 'HIT'
            response.headers['X-Cache-Key'] = cache_key[:8]  # Show first 8 chars
            return response

        # Get fresh response
        response = await call_next(request)

        # Cache successful responses
        if 200 <= response.status_code < 300:
            # Read response body
            body = b"".join([chunk async for chunk in response.body_iterator])

            # Store in cache
            cache_data = {
                'body': body,
                'status_code': response.status_code,
                'headers': dict(response.headers),
                'media_type': response.media_type
            }
            cache.set(cache_key, cache_data, ttl)

            # Recreate response with body
            response = Response(
                content=body,
                status_code=response.status_code,
                headers=response.headers,
                media_type=response.media_type
            )

            # Add cache miss header
            response.headers['X-Cache'] = 'MISS'
            response.headers['X-Cache-TTL'] = str(ttl)
            response.headers['X-Cache-Key'] = cache_key[:8]

        return response


def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching pattern."""
    # For now, just clear entire cache when data changes
    # In production, you'd implement more sophisticated pattern matching
    cache.clear()


def get_cache_stats():
    """Get cache statistics for monitoring."""
    return cache.stats()