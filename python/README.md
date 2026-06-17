# email-intel

Enterprise standard email intelligence and verification library for Python.

Reliably detect email providers, verify MX and SPF/DMARC records, and identify disposable or temporary email addresses.

## Features

- **DNS Verification**: MX, SPF, DMARC, and basic DKIM checks.
- **Provider Inference**: Identifies Google Workspace, Microsoft 365, Zoho, etc.
- **Disposable Detection**: Checks domains against an automatically updated daily list of disposable email services.
- **Public vs Business**: Distinguishes between free public webmails (Gmail, Yahoo) and custom business domains.
- **Confidence Scoring**: Computes a risk and confidence score for the email address.

## Installation

```bash
pip install email-intel
```

## Usage

### In your Python application

```python
from email_intel import analyze

result = analyze("john@acme.com")

print(f"Valid: {result['valid']}")
print(f"Provider: {result['provider']}")
print(f"Risk: {result['risk']}")
```

### CLI Usage

You can also use the package globally as a CLI tool:

```bash
email-intel john@acme.com
```

This will output a nice, formatted intelligence report in your terminal!
