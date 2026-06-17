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
        r1 = requests.get("https://raw.githubusercontent.com/itshivams/email-intel/main/data/disposable.json", timeout=5)
        _cached_disposable = set(r1.json()) if r1.status_code == 200 else FALLBACK_DISPOSABLE
    except:
        _cached_disposable = FALLBACK_DISPOSABLE

    try:
        r2 = requests.get("https://raw.githubusercontent.com/itshivams/email-intel/main/data/free.json", timeout=5)
        _cached_public = set(r2.json()) if r2.status_code == 200 else FALLBACK_PUBLIC
    except:
        _cached_public = FALLBACK_PUBLIC

def infer_provider(mx_records):
    mx_str = " ".join(mx_records).lower()
    if "google.com" in mx_str or "googlemail.com" in mx_str:
        return "Google Workspace", 98
    if "mail.protection.outlook.com" in mx_str:
        return "Microsoft 365", 98
    if "pphosted.com" in mx_str:
        return "Proofpoint", 95
    if "mimecast.com" in mx_str:
        return "Mimecast", 95
    if "barracudanetworks.com" in mx_str:
        return "Barracuda", 95
    if "iphmx.com" in mx_str:
        return "Cisco IronPort", 95
    if "amazonses.com" in mx_str:
        return "Amazon SES", 95
    if "mx.cloudflare.net" in mx_str:
        return "Cloudflare", 95
    if "mailgun.org" in mx_str:
        return "Mailgun", 95
    if "sendgrid.net" in mx_str:
        return "Sendgrid", 95
    if "secureserver.net" in mx_str:
        return "GoDaddy", 95
    if "zoho.com" in mx_str or "zoho.in" in mx_str:
        return "Zoho Mail", 95
    if "protonmail.ch" in mx_str or "protonmail.com" in mx_str:
        return "Proton Mail", 95
    if "yandex.net" in mx_str:
        return "Yandex", 95
    if "fastmail.com" in mx_str:
        return "Fastmail", 95
    return "Unknown", 0

def determine_domain_type(domain, is_public, is_disposable):
    if is_disposable: return "Disposable"
    if is_public: return "Public Webmail"

    if re.search(r'\.(edu|ac)(\.[a-z]{2})?$', domain, re.I):
        if domain.endswith('.in'): return "Indian Education"
        if domain.endswith('.uk'): return "UK Education"
        return "Education"

    if re.search(r'\.(gov|mil)(\.[a-z]{2})?$', domain, re.I):
        if domain.endswith('.in'): return "Indian Government"
        if domain.endswith('.uk'): return "UK Government"
        if domain.endswith('.gov') or domain.endswith('.mil'): return "US Government"
        return "Government"

    if re.search(r'\.org(\.[a-z]{2})?$', domain, re.I):
        return "Organization"

    return "Business"

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
    selectors = ['google', 'default', 's1', 's2', 'm1', 'm2', 'k1', 'k2', 'selector1', 'mail', 'dkim']
    for selector in selectors:
        dkim_probes.extend(resolve_txt(f"{selector}._domainkey.{domain}"))

    mx = len(mx_records) > 0
    spf = any("v=spf1" in txt for txt in txt_records)
    dmarc = any("v=DMARC1" in txt for txt in dmarc_records)
    dkim = len(dkim_probes) > 0

    provider, provider_conf = infer_provider(mx_records)
    domain_type = determine_domain_type(domain, is_public, is_disposable)
    
    if is_public and provider == "Unknown":
        provider = "Public Webmail"

    score = 0
    if mx:
        score += 30
        if spf: score += 20
        if dmarc: score += 15
        if not is_disposable: score += 10
        score += 10
        score += 15 

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
        "type": domain_type,
        "catchAll": False,
        "risk": risk,
        "confidence": score
    }
