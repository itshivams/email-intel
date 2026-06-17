const fs = require('fs/promises');
const path = require('path');

const DISPOSABLE_URL = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';
const FREE_URL = 'https://raw.githubusercontent.com/Kikobeats/free-email-domains/master/domains.json';

const SEEDED_PUBLIC_DOMAINS = [
	"aol.com", "gmail.com", "googlemail.com", "hotmail.com", "icloud.com", "live.com",
	"mail.com", "msn.com", "outlook.com", "proton.me", "protonmail.com", "rediffmail.com",
	"yahoo.com", "yandex.com", "zoho.com",
];

const SEEDED_DISPOSABLE_DOMAINS = [
	"10minutemail.com", "dispostable.com", "fakeinbox.com", "guerrillamail.com",
	"maildrop.cc", "mailinator.com", "moakt.com", "sharklasers.com", "tempmail.com",
	"temp-mail.org", "throwawaymail.com", "trashmail.com", "yopmail.com",
];

function normalize(domains) {
  const seen = new Set();
  for (let d of domains) {
    if (!d) continue;
    d = d.trim().toLowerCase();
    if (d && !d.startsWith('#')) {
      seen.add(d);
    }
  }
  return Array.from(seen).sort();
}

async function fetchDisposable() {
  const res = await fetch(DISPOSABLE_URL);
  if (!res.ok) throw new Error(`Failed to fetch disposable domains: ${res.status}`);
  const text = await res.text();
  const list = text.split('\n');
  return list;
}

async function fetchFree() {
  const res = await fetch(FREE_URL);
  if (!res.ok) throw new Error(`Failed to fetch free domains: ${res.status}`);
  const data = await res.json();
  return data;
}

async function run() {
  console.log('Fetching disposable domains...');
  let fetchedDisposable = [];
  try {
    fetchedDisposable = await fetchDisposable();
  } catch (e) {
    console.error(e);
  }

  console.log('Fetching free domains...');
  let fetchedFree = [];
  try {
    fetchedFree = await fetchFree();
  } catch (e) {
    console.error(e);
  }

  const finalDisposable = normalize([...SEEDED_DISPOSABLE_DOMAINS, ...fetchedDisposable]);
  const finalFree = normalize([...SEEDED_PUBLIC_DOMAINS, ...fetchedFree]);

  const dataDir = path.join(__dirname, '..', 'data');
  
  await fs.writeFile(
    path.join(dataDir, 'disposable.json'),
    JSON.stringify(finalDisposable, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'free.json'),
    JSON.stringify(finalFree, null, 2)
  );

  console.log(`Saved ${finalDisposable.length} disposable domains and ${finalFree.length} free domains.`);
}

run().catch(err => {
  console.error('Error updating domains:', err);
  process.exit(1);
});
