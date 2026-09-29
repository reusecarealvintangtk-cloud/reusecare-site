const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { chromium } = require('C:/Users/hello/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = process.cwd();
const routes = [
  '/pul-fabric/',
  '/reusable-menstrual-pads/',
  '/cloth-diapers/',
  '/reusable-nursing-pads/',
  '/reusable-swim-diapers/',
  '/factory-quality/',
  '/resources/',
  '/resources/reusable-textile-production-workflow/',
  '/resources/custom-printing-quality-checks/',
  '/resources/cloth-diaper-quality-inspection/',
  '/resources/private-label-packaging-warehouse/'
];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  let target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(root + path.sep) && target !== root) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(4182, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const results = [];
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      for (const route of routes) {
        const response = await page.goto('http://127.0.0.1:4182' + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route + ' status');
        await page.evaluate(async () => {
          document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
          await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        });
        const checks = await page.evaluate(() => {
          const structuredData = [...document.querySelectorAll('script[type="application/ld+json"]')];
          const invalidStructuredData = structuredData.filter(script => {
            try { JSON.parse(script.textContent); return false; } catch { return true; }
          }).length;
          return {
            title: document.title,
            h1: document.querySelectorAll('h1').length,
            main: document.querySelectorAll('main').length,
            overflow: document.documentElement.scrollWidth > innerWidth,
            brokenImages: [...document.images].filter(image => !image.naturalWidth).map(image => image.src),
            invalidStructuredData
          };
        });
        assert(checks.title.length > 0, route + ' title');
        assert.equal(checks.h1, 1, route + ' H1');
        assert.equal(checks.main, 1, route + ' main landmark');
        assert.equal(checks.overflow, false, route + ' horizontal overflow at ' + width);
        assert.equal(checks.brokenImages.length, 0, route + ' broken images');
        assert.equal(checks.invalidStructuredData, 0, route + ' structured data');
        results.push({ route, width, ...checks });
      }
      if (width === 1440) {
        await page.goto('http://127.0.0.1:4182/resources/reusable-textile-production-workflow/', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'outputs/seo-evidence-article.png', fullPage: true });
      }
      if (width === 390) {
        await page.goto('http://127.0.0.1:4182/pul-fabric/', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'outputs/seo-intent-mobile.png', fullPage: true });
      }
      await page.close();
      assert.equal(pageErrors.length, 0, JSON.stringify(pageErrors));
    }
    console.log(JSON.stringify({ passed: true, pages: routes.length, checks: results.length }));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
