import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const OUT_DIR = path.join(__dirname, '../gt1-export');
const MEMBROS_FPE = 225;

const LOGO_B64 = (() => {
  const buf = fs.readFileSync(path.join(PUBLIC_DIR, 'marca-white.png'));
  return `data:image/png;base64,${buf.toString('base64')}`;
})();

/**
 * GT1 · Cards de pauta (Família) — renderiza os 3 cards reais com votos
 * filtrados APENAS para membros da Bancada Evangélica (FPE, 225 deputados
 * com isFpeMember=true na API).
 *
 * Correções 15/09/2026 (feedback Rilson):
 *  1. Logo embutido como base64 (file:// não resolvia no Playwright)
 *  2. Headline "Como a Bancada Evangélica votou" adicionada
 *  3. Placar reformatado: SIM / NÃO / ABST lado a lado (sem "/" confuso)
 *  4. Participação: "X dos 225 membros votaram"
 *  5. Tagline corrigida para "TRANSPARÊNCIA PARLAMENTAR"
 *
 * Uso: pnpm exec tsx scripts/render-gt1-cards.ts
 */

interface CardData {
  arquivo: string;
  selo: string;
  titulo: string;
  pauta: string;
  faz: string;
  total: number;
  sim: number;
  nao: number;
  abst: number;
  data: string;
  utm: string;
  rodapeLink: string;
}

const CARDS: CardData[] = [
  {
    arquivo: 'gt1-familia-pauta1-pl6233.png',
    selo: 'Pa u t a · F a m í l i a',
    titulo: 'PL 6233/2023',
    pauta: 'Código Civil · atualização monetária e juros',
    faz: 'Altera a Lei nº 10.406 (Código Civil) para dispor sobre a atualização monetária e os juros em contratos — regra que toca o bolso de quem toma ou concede crédito.',
    total: 152,
    sim: 152,
    nao: 0,
    abst: 0,
    data: 'Votado em 19/03/2024',
    utm: 'gt1-familia-pauta1-pl6233',
    rodapeLink: 'votacoes',
  },
  {
    arquivo: 'gt1-familia-pauta2-pl3914.png',
    selo: 'Pa u t a · F a m í l i a',
    titulo: 'PL 3914/2023',
    pauta: 'Violência patrimonial contra a criança',
    faz: 'Cria o crime de violência patrimonial contra crianças e adolescentes (novo art. 244-C do ECA): usar, abusar ou desviar os recursos, bens e rendimentos de um menor.',
    total: 159,
    sim: 84,
    nao: 75,
    abst: 0,
    data: 'Votado em 25/03/2025',
    utm: 'gt1-familia-pauta2-pl3914',
    rodapeLink: 'votacoes',
  },
  {
    arquivo: 'gt1-familia-pauta3-pl5122.png',
    selo: 'Pa u t a · F a m í l i a',
    titulo: 'PL 5122/2023',
    pauta: 'Anistia e rebate de dívidas de crédito rural',
    faz: 'Autoriza liquidar, perdoar, renegociar e dar desconto em dívidas de crédito rural de agricultores, pecuaristas, piscicultores, pescadores e carcinicultores — efeito direto no preço dos alimentos.',
    total: 176,
    sim: 159,
    nao: 16,
    abst: 0,
    data: 'Votado em 16/07/2025',
    utm: 'gt1-familia-pauta3-pl5122',
    rodapeLink: 'votacoes',
  },
];

const ORIGIN = 'https://a-bancada-evangelica.vercel.app';

function cardHTML(c: CardData): string {
  const simPct = Math.round((c.sim / c.total) * 100);
  const naoPct = Math.round((c.nao / c.total) * 100);
  const abstPct = Math.round((c.abst / c.total) * 100);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1080px; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .card { width: 1080px; height: 1080px; background: #ffffff; display: flex; flex-direction: column; overflow: hidden; }

  .filigree { height: 14px; background: #b49a60; flex: none; }

  .body {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 56px 68px 40px; text-align: center;
  }

  .selo {
    display: inline-block; margin: 0 auto 28px; padding: 10px 26px;
    border: 1px solid #b49a60; border-radius: 999px;
    color: #1e293b; font-size: 26px; font-weight: 700; letter-spacing: 0.24em;
  }

  .headline {
    margin-bottom: 20px; font-size: 28px; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase; color: #b49a60;
  }

  .titulo { font-size: 92px; font-weight: 800; color: #0f172a; line-height: 1.02; }
  .pauta { margin-top: 16px; font-size: 34px; font-weight: 700; color: #1e3a5f; }
  .faz { margin: 28px auto 0; max-width: 900px; font-size: 28px; line-height: 1.45; color: #334155; font-weight: 500; }

  .nums { margin-top: 40px; display: flex; gap: 20px; justify-content: center; }
  .num-col {
    flex: 1; max-width: 260px;
    border: 2px solid #e2e8f0; border-radius: 16px;
    padding: 22px 12px 18px; text-align: center;
  }
  .num-col.sim { border-color: #16a34a; }
  .num-col.sim .num-val { color: #16a34a; }
  .num-col.nao { border-color: #dc2626; }
  .num-col.nao .num-val { color: #dc2626; }
  .num-col.abst { border-color: #94a3b8; }
  .num-col.abst .num-val { color: #64748b; }

  .num-val { font-size: 68px; font-weight: 800; line-height: 1; }
  .num-lbl { font-size: 22px; font-weight: 700; letter-spacing: 0.1em; color: #64748b; margin-top: 8px; }
  .num-pct { font-size: 24px; font-weight: 600; color: #94a3b8; margin-top: 4px; }

  .participacao { margin-top: 32px; font-size: 26px; font-weight: 600; color: #64748b; }
  .data { margin-top: 20px; font-size: 24px; font-weight: 600; letter-spacing: 0.12em; color: #94a3b8; text-transform: uppercase; }

  .footer { flex: none; padding: 36px 56px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; }
  .footer .brand { display: flex; align-items: center; gap: 18px; }
  .footer .brand img { width: 56px; height: 56px; }
  .footer .brand .t { color: #ffffff; font-size: 24px; font-weight: 800; }
  .footer .brand .s { color: #b49a60; font-size: 16px; font-weight: 600; letter-spacing: 0.12em; }
  .footer .u { text-align: right; }
  .footer .u .dom { color: #ffffff; font-size: 18px; font-weight: 700; }
  .footer .u .utm { color: #94a3b8; font-size: 16px; }
</style>
</head>
<body>
  <div class="card">
    <div class="filigree"></div>

    <div class="body">
      <div>
        <span class="selo">${c.selo}</span>
      </div>
      <div class="headline">Como a Bancada Evangélica votou</div>
      <div class="titulo">${c.titulo}</div>
      <div class="pauta">${c.pauta}</div>
      <p class="faz">${c.faz}</p>

      <div class="nums">
        <div class="num-col sim">
          <div class="num-val">${c.sim}</div>
          <div class="num-lbl">SIM</div>
          <div class="num-pct">${simPct}%</div>
        </div>
        <div class="num-col nao">
          <div class="num-val">${c.nao}</div>
          <div class="num-lbl">NÃO</div>
          <div class="num-pct">${naoPct}%</div>
        </div>
        <div class="num-col abst">
          <div class="num-val">${c.abst}</div>
          <div class="num-lbl">ABST.</div>
          <div class="num-pct">${abstPct}%</div>
        </div>
      </div>

      <div class="participacao">${c.total} dos ${MEMBROS_FPE} membros votaram</div>
      <div class="data">${c.data}</div>
    </div>

    <div class="footer">
      <div class="brand">
        <img src="${LOGO_B64}" alt="" />
        <div>
          <div class="t">A Bancada Evangélica</div>
          <div class="s">TRANSPARÊNCIA PARLAMENTAR</div>
        </div>
      </div>
      <div class="u">
        <div class="dom">a-bancada-evangelica.vercel.app</div>
        <div class="utm">/${c.rodapeLink}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const card of CARDS) {
    const html = cardHTML(card);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const out = path.join(OUT_DIR, card.arquivo);
    await page.screenshot({ path: out });
    const simPct = Math.round((card.sim / card.total) * 100);
    console.log(
      `✅ ${card.arquivo} — ${card.total} votos (${card.sim} SIM/${card.nao} NÃO/${card.abst} abst.) · ${simPct}%`,
    );
  }

  await browser.close();
  console.log(`\n${CARDS.length} cards → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
