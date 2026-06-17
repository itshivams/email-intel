# email-intel

Enterprise standard email intelligence and verification library for Node.js, Browsers, and CLI.

Reliably detect email providers, verify MX and SPF/DMARC records, and identify disposable or temporary email addresses.

## Features

- **Isomorphic**: Works in Node.js backend, Frontend browsers (using DoH), and CLI.
- **DNS Verification**: MX, SPF, DMARC, and basic DKIM checks.
- **Provider Inference**: Identifies Google Workspace, Microsoft 365, Zoho, etc.
- **Disposable Detection**: Checks domains against an automatically updated daily list of disposable email services.
- **Public vs Business**: Distinguishes between free public webmails (Gmail, Yahoo) and custom business domains.
- **Confidence Scoring**: Computes a risk and confidence score for the email address.

## Installation

```bash
npm install email-intel
```

## Usage

### In Node.js / Browser (TypeScript/JavaScript)

```typescript
import { analyze } from 'email-intel';

async function main() {
  const result = await analyze("john@acme.com");
  console.log(result);
}

main();
```

**Example Output:**
```json
{
  "email": "john@acme.com",
  "domain": "acme.com",
  "valid": true,
  "provider": "Google Workspace",
  "providerConfidence": 98,
  "mx": true,
  "spf": true,
  "dkim": true,
  "dmarc": true,
  "disposable": false,
  "publicProvider": false,
  "businessEmail": true,
  "catchAll": false,
  "risk": "low",
  "confidence": 95
}
```

### CLI Usage

You can also use the package globally as a CLI tool:

```bash
npm install -g email-intel

email-intel john@acme.com
```

This will output a nice, formatted intelligence report in your terminal!

## How it Works

- **DNS**: Uses native `dns` module in Node.js. If run in the browser, seamlessly falls back to Google's DNS-over-HTTPS (DoH).
- **Lists**: `email-intel` leverages an open-source daily GitHub Action that maintains up-to-date lists of thousands of disposable and free email providers.
