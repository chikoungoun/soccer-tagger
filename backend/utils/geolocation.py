import requests
import json
from typing import Dict, Optional

def get_geolocation_from_ip(ip_address: str) -> Dict[str, Optional[str]]:
    """
    Get geolocation information from IP address using a free IP geolocation service
    """
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1', 'unknown']:
        return {
            "country": None,
            "country_code": None,
            "region": None,
            "city": None,
            "latitude": None,
            "longitude": None,
            "timezone": None
        }

    try:
        # Using ipapi.co (free service with 1000 requests/day)
        response = requests.get(f"https://ipapi.co/{ip_address}/json/", timeout=5)

        if response.status_code == 200:
            data = response.json()

            # Check if the response contains an error
            if 'error' in data:
                print(f"Geolocation API error: {data.get('reason', 'Unknown error')}")
                return _get_fallback_geolocation()

            return {
                "country": data.get("country_name"),
                "country_code": data.get("country_code"),
                "region": data.get("region"),
                "city": data.get("city"),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "timezone": data.get("timezone")
            }
        else:
            print(f"Geolocation API returned status code: {response.status_code}")
            return _get_fallback_geolocation()

    except requests.exceptions.Timeout:
        print("Geolocation API request timed out")
        return _get_fallback_geolocation()
    except requests.exceptions.RequestException as e:
        print(f"Geolocation API request failed: {e}")
        return _get_fallback_geolocation()
    except json.JSONDecodeError:
        print("Failed to parse geolocation API response")
        return _get_fallback_geolocation()
    except Exception as e:
        print(f"Unexpected error in geolocation lookup: {e}")
        return _get_fallback_geolocation()

def _get_fallback_geolocation() -> Dict[str, Optional[str]]:
    """
    Return empty geolocation data when API fails
    """
    return {
        "country": None,
        "country_code": None,
        "region": None,
        "city": None,
        "latitude": None,
        "longitude": None,
        "timezone": None
    }

def get_geolocation_summary(sessions_data: list) -> Dict[str, int]:
    """
    Generate a summary of countries from session data
    """
    country_counts = {}

    for session in sessions_data:
        country = session.get('country')
        if country:
            country_counts[country] = country_counts.get(country, 0) + 1

    return dict(sorted(country_counts.items(), key=lambda x: x[1], reverse=True))

def format_location_string(country: str, region: str, city: str) -> str:
    """
    Format location components into a readable string
    """
    parts = []
    if city:
        parts.append(city)
    if region and region != city:
        parts.append(region)
    if country:
        parts.append(country)

    return ", ".join(parts) if parts else "Unknown Location"