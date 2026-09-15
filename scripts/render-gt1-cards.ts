import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const OUT_DIR = path.join(__dirname, '../gt1-export');

/**
 * GT1 · Cards de pauta (Família) — renderiza os 3 cards reais a partir de
 * números VERIFICADOS na API pública (GET /api/votes/analysis · critério
 * FAMILY_VALUES) em 14/09/2026 e tira print 1080×1080 (padrão WhatsApp/X).
 *
 * Regra de honestidade (auditoria 14/09): os números abaixo são os REAIS
 * retornados pela API em produção, nunca fabricados. Se a API mudar, editar
 * estes números exige re-verificação — não é fallback, é dado verificado.
 *
 * Uso: pnpm exec tsx scripts/render-gt1-cards.ts
 */

interface CardData {
  arquivo: string; // nome do PNG de saída
  selo: string; // etiqueta de topo (critério)
  titulo: string; // título curto do card
  pauta: string; // número da pauta
  faz: string; // o que faz (ementa curta)
  placar: string; // legenda do placar
  total: number;
  sim: number;
  nao: number;
  abst: number;
  consenso: number;
  data: string;
  utm: string; // valor completo de utm_campaign
  rodapeLink: string; // path sem UTM para o rodapé visual
}

const CARDS: CardData[] = [
  {
    arquivo: 'gt1-familia-pauta1-pl6233.png',
    selo: 'Pa u t a · F a m í l i a',
    titulo: 'PL 6233/2023',
    pauta: 'Código Civil · atualização monetária e juros',
    faz: 'Altera a Lei nº 10.406 (Código Civil) para dispor sobre a atualização monetária e os juros em contratos — regra que toca o bolso de quem toma ou concede crédito.',
    placar: 'O placar em plenário',
    total: 340,
    sim: 335,
    nao: 3,
    abst: 1,
    consenso: 99,
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
    placar: 'O placar em plenário',
    total: 365,
    sim: 270,
    nao: 94,
    abst: 0,
    consenso: 74,
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
    placar: 'O placar em plenário',
    total: 403,
    sim: 314,
    nao: 87,
    abst: 1,
    consenso: 78,
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
  const shareUrl = `${ORIGIN}/${c.rodapeLink}?utm_source=whatsapp&utm_medium=share&utm_campaign=${c.utm}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1080px; }
  /* fonte sistema — evita fetch externo / rede indisponível no render */
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .card { width: 1080px; height: 1080px; background: #ffffff; display: flex; flex-direction: column; overflow: hidden; }

  /* fio dourado — assinatura da marca */
  .filigree { height: 14px; background: #b49a60; flex: none; }

  .body {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 64px 68px 40px; text-align: center;
  }

  .selo {
    display: inline-block; margin: 0 auto 46px; padding: 10px 26px;
    border: 1px solid #b49a60; border-radius: 999px;
    color: #1e293b; font-size: 26px; font-weight: 700; letter-spacing: 0.24em;
  }

  .titulo { font-size: 96px; font-weight: 800; color: #0f172a; line-height: 1.02; }
  .pauta { margin-top: 20px; font-size: 34px; font-weight: 700; color: #1e3a5f; }
  .faz { margin: 34px auto 0; max-width: 900px; font-size: 30px; line-height: 1.45; color: #334155; font-weight: 500; }

  .placar { margin-top: 46px; font-size: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: #64748b; }

  .nums { margin-top: 26px; display: flex; align-items: center; justify-content: center; gap: 0; }
  .nums .big { font-size: 108px; font-weight: 800; color: #1e3a5f; line-height: 1; }
  .nums .slash { font-size: 64px; font-weight: 800; color: #b49a60; margin: 0 8px; }
  .nums .div { text-align: left; padding-left: 18px; border-left: 2px solid #e2e8f0; }
  .nums .div .v { font-size: 44px; font-weight: 800; color: #0f172a; line-height: 1; }
  .nums .div .l { font-size: 20px; font-weight: 600; letter-spacing: 0.1em; color: #64748b; margin-top: 6px; }

  .consenso { margin-top: 40px; font-size: 30px; font-weight: 700; color: #1e3a5f; }
  .data { margin-top: 26px; font-size: 24px; font-weight: 600; letter-spacing: 0.12em; color: #94a3b8; text-transform: uppercase; }

  .footer { flex: none; padding: 40px 56px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; }
  .footer .brand { display: flex; align-items: center; gap: 18px; }
  .footer .brand img { width: 60px; height: 60px; }
  .footer .brand .t { color: #ffffff; font-size: 26px; font-weight: 800; }
  .footer .brand .s { color: #b49a60; font-size: 18px; font-weight: 600; letter-spacing: 0.12em; }
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
      <div class="titulo">${c.titulo}</div>
      <div class="pauta">${c.pauta}</div>
      <p class="faz">${c.faz}</p>

      <div class="placar">${c.placar}</div>
      <div class="nums">
        <span class="big">${c.total}</span>
        <span class="slash">/</span>
        <div class="div">
          <div class="v">${simPct}% SIM</div>
          <div class="l">de ${c.total} votos reais</div>
        </div>
      </div>

      <div class="consenso">Consenso ${c.consenso}% · ${c.nao} NÃO · ${abstPct}% abstenção</div>
      <div class="data">${c.data}</div>
    </div>

    <div class="footer">
      <div class="brand">
        <img src="file://${PUBLIC_DIR}/marca-white.png" alt="" />
        <div>
          <div class="t">A Bancada Evangélica</div>
          <div class="s">Transparência por votos nominais</div>
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
    // garante que a imagem da marca carregou antes do print
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
    });
    const out = path.join(OUT_DIR, card.arquivo);
    await page.screenshot({ path: out });
    console.log(`✅ ${card.arquivo} — ${card.total} votos · ${simPctToStr(card)}`);
  }

  await browser.close();
  console.log(`\n${CARDS.length} cards → ${OUT_DIR}`);
}

function simPctToStr(c: CardData) {
  return `${Math.round((c.sim / c.total) * 100)}% SIM`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
