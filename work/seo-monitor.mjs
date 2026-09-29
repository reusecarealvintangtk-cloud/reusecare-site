import process from 'node:process';

const site = (process.env.SEO_SITE || 'https://www.reusecare.com').replace(/\/$/, '');
const sitemapUrl = `${site}/sitemap.xml`;
const userAgent = 'ReuseCare-SEO-Monitor/1.0 (+https://www.reusecare.com/)';

function extract(content, pattern) {
  return content.match(pattern)?.[1]?.trim() || '';
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml,application/xml' },
    signal: AbortSignal.timeout(20000),
  });
  return { response, text: await response.text() };
}

const sitemap = await fetchText(sitemapUrl);
if (!sitemap.response.ok) {
  throw new Error(`Sitemap request failed: ${sitemap.response.status} ${sitemapUrl}`);
}

const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
if (!urls.length) throw new Error('No URLs found in sitemap.xml');

const results = await Promise.all(urls.map(async (url) => {
  try {
    const { response, text: html } = await fetchText(url);
    const title = decode(extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
    const description = decode(extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i));
    const canonical = decode(extract(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i));
    const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
    const noindex = /<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
    const schemaBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let schemaValid = schemaBlocks.length > 0;
    for (const block of schemaBlocks) {
      try { JSON.parse(block[1]); } catch { schemaValid = false; }
    }

    const failures = [];
    const warnings = [];
    if (response.status !== 200) failures.push(`HTTP ${response.status}`);
    if (!title) failures.push('missing title');
    if (!description) failures.push('missing description');
    if (!canonical) failures.push('missing canonical');
    if (canonical && canonical !== url) failures.push(`canonical mismatch: ${canonical}`);
    if (h1Count !== 1) failures.push(`H1 count ${h1Count}`);
    if (noindex) failures.push('noindex present');
    if (!schemaBlocks.length) warnings.push('no JSON-LD');
    else if (!schemaValid) failures.push('invalid JSON-LD');
    if (title.length > 65) warnings.push(`title length ${title.length}`);
    if (description.length > 165) warnings.push(`description length ${description.length}`);

    return { url, status: response.status, failures, warnings };
  } catch (error) {
    return { url, status: 0, failures: [error.message], warnings: [] };
  }
}));

const failed = results.filter((result) => result.failures.length);
const warned = results.filter((result) => result.warnings.length);
const lines = [
  '# ReuseCare SEO health report',
  '',
  `Checked: ${new Date().toISOString()}`,
  `Sitemap URLs: ${results.length}`,
  `Critical failures: ${failed.length}`,
  `Warnings: ${warned.length}`,
  '',
];

if (failed.length) {
  lines.push('## Critical failures', '');
  for (const item of failed) lines.push(`- ${item.url}: ${item.failures.join('; ')}`);
  lines.push('');
}
if (warned.length) {
  lines.push('## Warnings', '');
  for (const item of warned) lines.push(`- ${item.url}: ${item.warnings.join('; ')}`);
  lines.push('');
}
if (!failed.length && !warned.length) lines.push('All sitemap pages passed the crawlability and metadata checks.', '');

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`, 'utf8');
}
if (failed.length) process.exitCode = 1;
