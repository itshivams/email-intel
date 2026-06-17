import re
import dns.resolver
import requests

__version__ = "1.0.0"

FALLBACK_DISPOSABLE = {
    "10minutemail.com", "dispostable.com", "guerrillamail.com", "mailinator.com",
    "tempmail.com", "temp-mail.org", "yopmail.com"
}

FALLBACK_PUBLIC = {
    "aol.com", "gmail.com", "googlemail.com", "hotmail.com", "icloud.com", "live.com",
    "mail.com", "msn.com", "outlook.com", "proton.me", "protonmail.com", "yahoo.com", "zoho.com"
}

_cached_disposable = None
_cached_public = None

def fetch_lists():
    global _cached_disposable, _cached_public
    if _cached_disposable is not None and _cached_public is not None:
        return

    try:
        r1 = requests.get("https://raw.githubusercontent.com/itshivams/mailverify/main/data/disposable.json", timeout=5)
        _cached_disposable = set(r1.json()) if r1.status_code == 200 else FALLBACK_DISPOSABLE
    except:
        _cached_disposable = FALLBACK_DISPOSABLE

    try:
        r2 = requests.get("https://raw.githubusercontent.com/itshivams/mailverify/main/data/free.json", timeout=5)
        _cached_public = set(r2.json()) if r2.status_code == 200 else FALLBACK_PUBLIC
    except:
        _cached_public = FALLBACK_PUBLIC

def infer_provider(mx_records):
    mx_str = " ".join(mx_records).lower()
    if "google.com" in mx_str or "googlemail.com" in mx_str:
        return "Google Workspace", 98
    if "mail.protection.outlook.com" in mx_str:
        return "Microsoft 365", 98
    if "secureserver.net" in mx_str:
        return "GoDaddy", 95
    if "zoho.com" in mx_str:
        return "Zoho Mail", 95
    if "protonmail.ch" in mx_str or "protonmail.com" in mx_str:
        return "Proton Mail", 95
    if "yandex.net" in mx_str:
        return "Yandex", 95
    if "fastmail.com" in mx_str:
        return "Fastmail", 95
    return "Unknown", 0

def resolve_mx(domain):
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        return [str(r.exchange) for r in answers]
    except:
        return []

def resolve_txt(domain):
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        return [str(r) for r in answers]
    except:
        return []

def analyze(email: str) -> dict:
    parts = email.split('@')
    if len(parts) != 2:
        raise ValueError("Invalid email format")
    
    domain = parts[1].strip().lower()

    fetch_lists()

    is_disposable = domain in _cached_disposable
    is_public = domain in _cached_public

    mx_records = resolve_mx(domain)
    txt_records = resolve_txt(domain)
    dmarc_records = resolve_txt(f"_dmarc.{domain}")
    
    dkim_probes = []
    dkim_probes.extend(resolve_txt(f"google._domainkey.{domain}"))
    dkim_probes.extend(resolve_txt(f"default._domainkey.{domain}"))

    mx = len(mx_records) > 0
    spf = any("v=spf1" in txt for txt in txt_records)
    dmarc = any("v=DMARC1" in txt for txt in dmarc_records)
    dkim = len(dkim_probes) > 0

    provider, provider_conf = infer_provider(mx_records)
    
    if is_public and provider == "Unknown":
        provider = "Public Webmail"

    score = 0
    if mx: score += 30
    if spf: score += 20
    if dkim: score += 15
    if dmarc: score += 15
    if not is_disposable: score += 10
    score += 10

    risk = "high"
    if score >= 80 and not is_disposable:
        risk = "low"
    elif score >= 50:
        risk = "medium"
    
    if is_disposable:
        risk = "high"

    return {
        "email": email,
        "domain": domain,
        "valid": mx and not is_disposable,
        "provider": provider,
        "providerConfidence": provider_conf,
        "mx": mx,
        "spf": spf,
        "dkim": dkim,
        "dmarc": dmarc,
        "disposable": is_disposable,
        "publicProvider": is_public,
        "businessEmail": not is_public and not is_disposable,
        "catchAll": False,
        "risk": risk,
        "confidence": score
    }
