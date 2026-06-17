export async function resolveMx(domain: string): Promise<string[]> {
  if (typeof window !== 'undefined') {
    return dohQuery(domain, 'MX');
  } else {
    try {
      const dns = require('dns/promises');
      const records = await dns.resolveMx(domain);
      return records.map((r: any) => r.exchange);
    } catch (e) {
      return [];
    }
  }
}

export async function resolveTxt(domain: string): Promise<string[]> {
  if (typeof window !== 'undefined') {
    return dohQuery(domain, 'TXT');
  } else {
    try {
      const dns = require('dns/promises');
      const records = await dns.resolveTxt(domain);
      return records.map((r: string[]) => r.join(''));
    } catch (e) {
      return [];
    }
  }
}

async function dohQuery(domain: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.Answer) return [];

    if (type === 'MX') {
      return data.Answer.map((a: any) => {
        const parts = a.data.split(' ');
        return parts.length > 1 ? parts[1] : a.data;
      });
    } else if (type === 'TXT') {
      return data.Answer.map((a: any) => {
        let str = a.data;
        if (str.startsWith('"') && str.endsWith('"')) {
          str = str.slice(1, -1);
        }
        return str;
      });
    }
    return [];
  } catch (e) {
    return [];
  }
}
