import { resolveMx, resolveTxt } from './dns';

export interface EmailIntelResult {
  email: string;
  domain: string;
  valid: boolean;
  provider: string;
  providerConfidence: number;
  mx: boolean;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  disposable: boolean;
  publicProvider: boolean;
  type: string;
  catchAll: boolean;
  risk: string;
  confidence: number;
}

const FALLBACK_PUBLIC_DOMAINS = [
  "aol.com", "gmail.com", "googlemail.com", "hotmail.com", "icloud.com", "live.com",
  "mail.com", "msn.com", "outlook.com", "proton.me", "protonmail.com", "yahoo.com", "zoho.com",
];

const FALLBACK_DISPOSABLE_DOMAINS = [
  "10minutemail.com", "dispostable.com", "guerrillamail.com", "mailinator.com",
  "tempmail.com", "temp-mail.org", "yopmail.com",
];

let cachedDisposable: Set<string> | null = null;
let cachedPublic: Set<string> | null = null;

async function fetchLists() {
  if (cachedDisposable && cachedPublic) return;

  try {
    const [dispRes, pubRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/itshivams/email-intel/main/data/disposable.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/itshivams/email-intel/main/data/free.json').catch(() => null)
    ]);

    if (dispRes && dispRes.ok) {
      cachedDisposable = new Set(await dispRes.json());
    } else {
      cachedDisposable = new Set(FALLBACK_DISPOSABLE_DOMAINS);
    }

    if (pubRes && pubRes.ok) {
      cachedPublic = new Set(await pubRes.json());
    } else {
      cachedPublic = new Set(FALLBACK_PUBLIC_DOMAINS);
    }
  } catch (e) {
    cachedDisposable = new Set(FALLBACK_DISPOSABLE_DOMAINS);
    cachedPublic = new Set(FALLBACK_PUBLIC_DOMAINS);
  }
}

function inferProvider(mxRecords: string[]): { provider: string, confidence: number } {
  const mxStr = mxRecords.join(' ').toLowerCase();
  if (mxStr.includes('google.com') || mxStr.includes('googlemail.com')) return { provider: 'Google Workspace', confidence: 98 };
  if (mxStr.includes('mail.protection.outlook.com')) return { provider: 'Microsoft 365', confidence: 98 };
  if (mxStr.includes('pphosted.com')) return { provider: 'Proofpoint', confidence: 95 };
  if (mxStr.includes('mimecast.com')) return { provider: 'Mimecast', confidence: 95 };
  if (mxStr.includes('barracudanetworks.com')) return { provider: 'Barracuda', confidence: 95 };
  if (mxStr.includes('iphmx.com')) return { provider: 'Cisco IronPort', confidence: 95 };
  if (mxStr.includes('amazonses.com')) return { provider: 'Amazon SES', confidence: 95 };
  if (mxStr.includes('mx.cloudflare.net')) return { provider: 'Cloudflare', confidence: 95 };
  if (mxStr.includes('mailgun.org')) return { provider: 'Mailgun', confidence: 95 };
  if (mxStr.includes('sendgrid.net')) return { provider: 'Sendgrid', confidence: 95 };
  if (mxStr.includes('secureserver.net')) return { provider: 'GoDaddy', confidence: 95 };
  if (mxStr.includes('zoho.com') || mxStr.includes('zoho.in')) return { provider: 'Zoho Mail', confidence: 95 };
  if (mxStr.includes('protonmail.ch') || mxStr.includes('protonmail.com')) return { provider: 'Proton Mail', confidence: 95 };
  if (mxStr.includes('yandex.net')) return { provider: 'Yandex', confidence: 95 };
  if (mxStr.includes('fastmail.com')) return { provider: 'Fastmail', confidence: 95 };

  return { provider: 'Unknown', confidence: 0 };
}

function determineDomainType(domain: string, isPublic: boolean, isDisposable: boolean): string {
  if (isDisposable) return "Disposable";
  if (isPublic) return "Public Webmail";

  if (/\.(edu|ac)(\.in)?$/i.test(domain)) {
    if (domain.endsWith(".in")) return "Indian Education";
    if (domain.endsWith(".uk")) return "UK Education";
    return "Education";
  }

  if (/\.(gov|mil)(\.[a-z]{2})?$/i.test(domain)) {
    if (domain.endsWith(".in")) return "Indian Government";
    if (domain.endsWith(".uk")) return "UK Government";
    if (domain.endsWith(".gov") || domain.endsWith(".mil")) return "US Government";
    return "Government";
  }

  if (/\.org(\.[a-z]{2})?$/i.test(domain)) return "Organization";

  return "Business";
}

export async function analyze(email: string): Promise<EmailIntelResult> {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }
  const domain = parts[1].toLowerCase().trim();

  await fetchLists();

  const isDisposable = cachedDisposable!.has(domain);
  const isPublic = cachedPublic!.has(domain);

  const dkimSelectors = ['google', 'default', 's1', 's2', 'm1', 'm2', 'k1', 'k2', 'selector1', 'mail', 'dkim'];

  const [mxRecords, txtRecords, dmarcRecords, dkimProbes] = await Promise.all([
    resolveMx(domain),
    resolveTxt(domain),
    resolveTxt(`_dmarc.${domain}`),
    Promise.all(dkimSelectors.map(s => resolveTxt(`${s}._domainkey.${domain}`)))
  ]);

  const mx = mxRecords.length > 0;
  let spf = false;
  for (const txt of txtRecords) {
    if (txt.includes('v=spf1')) spf = true;
  }

  let dmarc = false;
  for (const txt of dmarcRecords) {
    if (txt.includes('v=DMARC1')) dmarc = true;
  }

  let dkim = false;
  for (const probe of dkimProbes) {
    if (probe.length > 0) dkim = true;
  }

  const { provider, confidence: providerConfidence } = inferProvider(mxRecords);
  const domainType = determineDomainType(domain, isPublic, isDisposable);

  let score = 0;
  if (mx) {
    score += 30;
    if (spf) score += 20;
    if (dmarc) score += 15;
    if (!isDisposable) score += 10;
    score += 10;
    score += 15;
  }

  let risk = "high";
  if (score >= 80 && !isDisposable) risk = "low";
  else if (score >= 50) risk = "medium";

  if (isDisposable) risk = "high";

  return {
    email,
    domain,
    valid: mx && !isDisposable,
    provider: isPublic ? (provider === 'Unknown' ? 'Public Webmail' : provider) : provider,
    providerConfidence,
    mx,
    spf,
    dkim,
    dmarc,
    disposable: isDisposable,
    publicProvider: isPublic,
    type: domainType,
    catchAll: false,
    risk,
    confidence: score
  };
}
