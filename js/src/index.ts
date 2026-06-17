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
  businessEmail: boolean;
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
      fetch('https://raw.githubusercontent.com/itshivams/mailverify/main/data/disposable.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/itshivams/mailverify/main/data/free.json').catch(() => null)
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
  if (mxStr.includes('secureserver.net')) return { provider: 'GoDaddy', confidence: 95 };
  if (mxStr.includes('zoho.com')) return { provider: 'Zoho Mail', confidence: 95 };
  if (mxStr.includes('protonmail.ch') || mxStr.includes('protonmail.com')) return { provider: 'Proton Mail', confidence: 95 };
  if (mxStr.includes('yandex.net')) return { provider: 'Yandex', confidence: 95 };
  if (mxStr.includes('fastmail.com')) return { provider: 'Fastmail', confidence: 95 };

  return { provider: 'Unknown', confidence: 0 };
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

  const [mxRecords, txtRecords, dmarcRecords, dkimProbes] = await Promise.all([
    resolveMx(domain),
    resolveTxt(domain),
    resolveTxt(`_dmarc.${domain}`),
    Promise.all([
      resolveTxt(`google._domainkey.${domain}`),
      resolveTxt(`default._domainkey.${domain}`)
    ])
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

  let score = 0;
  if (mx) score += 30;
  if (spf) score += 20;
  if (dkim) score += 15;
  if (dmarc) score += 15;
  if (!isDisposable) score += 10;
  score += 10;

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
    businessEmail: !isPublic && !isDisposable,
    catchAll: false,
    risk,
    confidence: score
  };
}
