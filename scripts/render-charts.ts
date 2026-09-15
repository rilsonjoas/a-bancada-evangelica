import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const OUT_DIR = path.join(__dirname, '../canal-x');

/**
 * Gráficos de divulgação (X/Twitter) — nota média real por partido e por
 * estado, agregados da API pública (GET /api/politicians) em 15/09/2026.
 *
 * Regra de honestidade (auditoria 14/09): os números vêm da API de
 * produção, nunca fabricados. Se a API mudar, re-gerar faz o gráfico
 * novo na hora — o script agrega do zero.
 *
 * Uso: pnpm exec tsx scripts/render-charts.ts
 */

const API_URL = 'https://api-bancada.narniano.com/api/politicians';

interface Row { label: string; n: number; avg: number; }

async function aggregate(): Promise<{ byParty: Row[]; byState: Row[] }> {
  const all: any[] = [];
  let offset = 0;
  for (;;) {
    const d = await fetch(`${API_URL}?limit=300&offset=${offset}`).then((r) => r.json());
    all.push(...(d.politicians ?? []));
    if (!d.hasMore) break;
    offset += 300;
  }

  const group = (key: (p: any) => string) => {
    const m = new Map<string, { n: number; sum: number }>();
    for (const p of all) {
      const k = key(p);
      const s = p.scores?.overall;
      if (s == null) continue;
      const e = m.get(k) ?? { n: 0, sum: 0 };
      e.n += 1;
      e.sum += s;
      m.set(k, e);
    }
    return [...m.entries()]
      .map(([label, { n, sum }]): Row => ({ label, n, avg: +(sum / n).toFixed(1) }))
      .sort((a, b) => b.n - a.n);
  };

  return { byParty: group((p) => p.currentParty), byState: group((p) => p.currentState) };
}

const ORIGIN = 'https://a-bancada-evangelica.vercel.app';

function chartHTML(title: string, subtitle: string, rows: Row[], top: number, utm: string): string {
  const sel = rows.slice(0, top);
  const max = Math.max(...sel.map((r) => r.avg));
  const barH = 56;
  const bars = sel
    .map((r, i) => {
      const w = Math.max(2, Math.round((r.avg / max) * 820));
      return `
        <div class="bar-row">
          <div class="bar-label">${r.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${w}px"><span class="bar-val">${r.avg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span></div>
          </div>
          <div class="bar-n">${r.n} parlam.</div>
        </div>`;
    })
    .join('\n');

  const totalH = 210 + sel.length * barH + 120;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: ${totalH}px; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .card { width: 1080px; height: ${totalH}px; background: #ffffff; display: flex; flex-direction: column; overflow: hidden; }
  .filigree { height: 14px; background: #b49a60; flex: none; }
  .head { padding: 48px 68px 32px; text-align: center; flex: none; }
  .head .selo { display: inline-block; margin: 0 auto 24px; padding: 8px 24px; border: 1px solid #b49a60; border-radius: 999px; color: #1e293b; font-size: 24px; font-weight: 700; letter-spacing: 0.2em; }
  .head h1 { font-size: 52px; font-weight: 800; color: #0f172a; line-height: 1.08; }
  .head .sub { margin-top: 14px; font-size: 24px; font-weight: 500; color: #475569; }
  .body { flex: none; padding: 4px 56px 16px; }
  .bar-row { display: flex; align-items: center; height: ${barH}px; gap: 16px; }
  .bar-label { width: 190px; text-align: right; font-size: 27px; font-weight: 700; color: #1e3a5f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-track { flex: 1; display: flex; align-items: center; }
  .bar-fill { background: #1e3a5f; border-radius: 6px; min-height: 32px; display: flex; align-items: center; justify-content: flex-start; padding-left: 14px; position: relative; }
  .bar-val { color: #ffffff; font-size: 23px; font-weight: 800; }
  .bar-n { width: 115px; font-size: 19px; font-weight: 600; color: #64748b; }
  .footer { flex: none; padding: 28px 56px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; }
  .footer .brand { display: flex; align-items: center; gap: 16px; }
  .footer .brand img { width: 48px; height: 48px; }
  .footer .brand .t { color: #ffffff; font-size: 22px; font-weight: 800; }
  .footer .brand .s { color: #b49a60; font-size: 15px; font-weight: 600; letter-spacing: 0.1em; }
  .footer .u { color: #94a3b8; font-size: 15px; font-weight: 600; }
</style>
</head>
<body>
  <div class="card">
    <div class="filigree"></div>
    <div class="head">
      <span class="selo">Dados reais · Câmara e Senado</span>
      <h1>${title}</h1>
      <div class="sub">${subtitle}</div>
    </div>
    <div class="body">${bars}</div>
    <div class="footer">
      <div class="brand">
        <img src="file://${PUBLIC_DIR}/marca-white.png" alt="" />
        <div>
          <div class="t">A Bancada Evangélica</div>
          <div class="s">Transparência por votos nominais</div>
        </div>
      </div>
      <div class="u">a-bancada-evangelica.vercel.app/${utm}</div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const { byParty, byState } = await aggregate();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

  const charts: Array<{ file: string; title: string; sub: string; rows: Row[]; top: number; utm: string }> = [
    {
      file: 'grafico-partido.png',
      title: 'Nota média por partido',
      sub: `${byParty.length} siglas · ${byParty.reduce((a, r) => a + r.n, 0)} parlamentares monitorados`,
      rows: byParty,
      top: 14,
      utm: 'ranking',
    },
    {
      file: 'grafico-estado.png',
      title: 'Nota média por estado',
      sub: `${byState.length} UFs · parlamentares monitorados por unidade da federação`,
      rows: byState,
      top: 14,
      utm: 'ranking',
    },
  ];

  for (const c of charts) {
    const html = chartHTML(c.title, c.sub, c.rows, c.top, c.utm);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
    });
    const out = path.join(OUT_DIR, c.file);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`✅ ${c.file} — top ${c.top} de ${c.rows.length} séries`);
  }

  await browser.close();
  console.log(`\ngráficos → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});