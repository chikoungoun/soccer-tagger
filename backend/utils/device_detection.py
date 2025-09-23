import re
from typing import Dict, Optional

def extract_device_info(user_agent: str, ip_address: str) -> Dict[str, Optional[str]]:
    """
    Extract device and browser information from user agent string
    """
    if not user_agent:
        return {
            "device_type": None,
            "browser_name": None,
            "browser_version": None,
            "os_name": None,
            "os_version": None,
            "ip_address": ip_address
        }

    return _fallback_device_detection(user_agent, ip_address)

def _fallback_device_detection(user_agent: str, ip_address: str) -> Dict[str, Optional[str]]:
    """
    Fallback device detection using regex patterns
    """
    device_info = {
        "device_type": "desktop",
        "browser_name": None,
        "browser_version": None,
        "os_name": None,
        "os_version": None,
        "ip_address": ip_address
    }

    user_agent_lower = user_agent.lower()

    # Device type detection
    mobile_patterns = [
        'mobile', 'android', 'iphone', 'ipod', 'blackberry',
        'windows phone', 'webos', 'palm'
    ]
    tablet_patterns = ['ipad', 'tablet', 'kindle', 'silk']

    if any(pattern in user_agent_lower for pattern in mobile_patterns):
        device_info["device_type"] = "mobile"
    elif any(pattern in user_agent_lower for pattern in tablet_patterns):
        device_info["device_type"] = "tablet"

    # Browser detection
    browser_patterns = {
        'chrome': r'chrome\/([\d.]+)',
        'firefox': r'firefox\/([\d.]+)',
        'safari': r'version\/([\d.]+).*safari',
        'edge': r'edge?\/([\d.]+)',
        'opera': r'opera\/([\d.]+)',
        'internet explorer': r'msie ([\d.]+)'
    }

    for browser_name, pattern in browser_patterns.items():
        match = re.search(pattern, user_agent_lower)
        if match:
            device_info["browser_name"] = browser_name.title()
            device_info["browser_version"] = match.group(1)
            break

    # OS detection
    os_patterns = {
        'windows': r'windows nt ([\d.]+)',
        'mac os': r'mac os x ([\d_.]+)',
        'linux': r'linux',
        'android': r'android ([\d.]+)',
        'ios': r'os ([\d_.]+) like mac os x'
    }

    for os_name, pattern in os_patterns.items():
        match = re.search(pattern, user_agent_lower)
        if match:
            device_info["os_name"] = os_name.title()
            if len(match.groups()) > 0:
                device_info["os_version"] = match.group(1).replace('_', '.')
            break

    return device_info

def get_client_ip(request) -> str:
    """
    Extract client IP address from request headers
    """
    # Check for forwarded IP addresses (common in load balancers/proxies)
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # Take the first IP address in the chain
        return forwarded_for.split(',')[0].strip()

    # Check for real IP header
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip.strip()

    # Fallback to client host
    return getattr(request.client, 'host', 'unknown')