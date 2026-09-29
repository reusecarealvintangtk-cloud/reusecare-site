import { readFile } from 'node:fs/promises';

const host = 'www.reusecare.com';
const key = 'reusecare-20260929-7f4c2a91b6d83e50';
const keyLocation = `https://${host}/${key}.txt`;
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length) throw new Error('No URLs found in sitemap.xml');

for (let attempt = 1; attempt <= 12; attempt += 1) {
  try {
    const verification = await fetch(keyLocation, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (verification.ok && (await verification.text()).trim() === key) break;
  } catch {
    // The deployment may still be propagating. Retry below.
  }
  if (attempt === 12) throw new Error(`IndexNow key was not published at ${keyLocation}`);
  await new Promise((resolve) => setTimeout(resolve, 15000));
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
  signal: AbortSignal.timeout(20000),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow submission failed with HTTP ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`);
