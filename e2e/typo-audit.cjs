/* Auditoria tipográfica programática (item ④ do ROADMAP, 2026-08-29).
 * Mede font-size / line-height de parágrafos e headings + overflow@390
 * nas rotas principais. Uso:
 *   node e2e/typo-audit.cjs                 # contra produção (Vercel)
 *   BASE_URL=http://localhost:4173 node e2e/typo-audit.cjs   # contra preview local
 * Meta do projeto: p de leitura ≥14px e line-height ≥1.5; 1 h1 por rota.
 */
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'https://a-bancada-evangelica.vercel.app';
const ROUTES = [
  '/', '/politicos/110', '/votacoes', '/temas', '/temas/meio-ambiente-energia',
  '/metodologia', '/dados', '/comparacao', '/grupos', '/errata', '/sobre',
];
const MIN_BODY_PX = 14;
const MIN_LH = 1.5;

function px(v) { return parseFloat(v); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1350, height: 900 } });
  const report = [];
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const metrics = await page.evaluate(() => {
      const px = (s) => parseFloat(s);
      const out = { h1: [], h2: [], h3: [], p: [] };
      document.querySelectorAll('h1,h2,h3').forEach((el) => {
        const cs = getComputedStyle(el);
        const r = { text: (el.textContent || '').trim().slice(0, 60), fs: px(cs.fontSize), lh: px(cs.lineHeight) };
        if (el.tagName === 'H1') out.h1.push(r);
        else if (el.tagName === 'H2') out.h2.push(r);
        else out.h3.push(r);
      });
      document.querySelectorAll('p').forEach((el) => {
        const cs = getComputedStyle(el);
        out.p.push({ text: (el.textContent || '').trim().slice(0, 50), fs: px(cs.fontSize), lh: px(cs.lineHeight) });
      });
      return out;
    });
    const problems = [];
    const h1Biggest = Math.max(...metrics.h1.map(x => x.fs), 0);
    const all = [...metrics.h1, ...metrics.h2, ...metrics.h3];
    for (const h of all) if (h.fs > h1Biggest + 2) problems.push(`H>h1 de ${h.fs}px ("${h.text}")`);
    for (const p of metrics.p) {
      if (p.fs && p.fs < MIN_BODY_PX) problems.push(`p ${p.fs}px < ${MIN_BODY_PX} ("${p.text}")`);
      if (p.fs && p.lh && p.lh / p.fs < MIN_LH) problems.push(`p line-height ${(p.lh / p.fs).toFixed(2)} < 1.5 ("${p.text}")`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (!cs.display || cs.display === 'none') return;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          bad.push(`${el.tagName.toLowerCase()}[${(el.textContent || '').trim().slice(0, 30)}] sw=${el.scrollWidth} cw=${el.clientWidth}`);
        }
      });
      return bad.slice(0, 12);
    });
    const h1Names = metrics.h1.map(h => `${Math.round(h.fs)}px "${h.text}"`);
    const h2avar = metrics.h2.length ? Math.round(metrics.h2.reduce((s, h) => s + h.fs, 0) / metrics.h2.length) : 0;
    report.push({
      route,
      h1Count: metrics.h1.length,
      h2Count: metrics.h2.length,
      h2AvgPx: h2avar,
      pSmall: metrics.p.filter(p => p.fs < MIN_BODY_PX).length,
      pBadLh: metrics.p.filter(p => p.fs && p.lh && p.lh / p.fs < MIN_LH).length,
      overflow390: overflow.length,
      problems,
    });
    console.log(`\n=== ${route} ===`);
    console.log('  h1:', JSON.stringify(h1Names));
    if (metrics.h2.length) console.log('  h2 avg:', h2avar, 'px  | h3 count:', metrics.h3.length);
    console.log(`  p<${MIN_BODY_PX}px: ${metrics.p.filter(x => x.fs < MIN_BODY_PX).length} | p lh<1.5: ${metrics.p.filter(x => x.fs && x.lh && x.lh / x.fs < MIN_LH).length} | overflow@390: ${overflow.length}`);
    for (const pb of problems) console.log('  ✗', pb);
    for (const o of overflow) console.log('  ow:', o);
    await page.setViewportSize({ width: 1350, height: 900 });
  }
  await browser.close();
  console.log('\n\nRESUMO');
  for (const r of report) {
    console.log(`${r.route} | h1=${r.h1Count} h2=${r.h2Count} h2avg=${r.h2AvgPx}px p<14=${r.pSmall} pLH<1.5=${r.pBadLh} ow390=${r.overflow390} | ${r.problems.join('; ')}`);
  }
})();