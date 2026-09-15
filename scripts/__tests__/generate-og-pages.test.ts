import { describe, it, expect } from 'vitest';
import { generatePoliticianPage } from '../generate-og-pages';

const TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>A Bancada Evangélica — Transparência Parlamentar</title>
    <meta name="description" content="Plataforma independente." />
    <meta property="og:title" content="A Bancada Evangélica — Transparência Parlamentar" />
    <meta property="og:description" content="Monitorando se os parlamentares." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://a-bancada-evangelica.vercel.app" />
    <meta property="og:image" content="https://a-bancada-evangelica.vercel.app/Logo.png" />
    <meta name="twitter:title" content="A Bancada Evangélica" />
    <meta name="twitter:description" content="Monitorando." />
    <meta name="twitter:image" content="https://a-bancada-evangelica.vercel.app/Logo.png" />
  </head>
  <body><div id="root"></div></body>
</html>`;

const BASE = 'https://a-bancada-evangelica.vercel.app';
const API = 'https://api-bancada.narniano.com';

describe('generatePoliticianPage', () => {
  it('substitui meta tags corretamente para político com votos', () => {
    const html = generatePoliticianPage(
      TEMPLATE,
      {
        id: 123,
        name: 'Maria da Silva',
        currentParty: 'PT',
        currentState: 'SP',
        photoUrl: 'https://camara.leg.br/foto.jpg',
        scores: { overall: 72, performanceLabel: 'Aderência alta', totalVotes: 45 },
      },
      BASE,
      API,
    );

    expect(html).toContain('<title>Maria da Silva (PT/SP) — A Bancada Evangélica</title>');
    expect(html).toContain('content="Nota de aderência 72/100 (Aderência alta) — baseada em 45 votos nominais públicos."');
    expect(html).toContain('content="profile"');
    expect(html).toContain(`content="${BASE}/politicos/123"`);
    expect(html).toContain(`content="${API}/api/politicians/123/photo"`);
    expect(html).toContain(`<link rel="canonical" href="${BASE}/politicos/123" />`);
  });

  it('usa descrição honesta para político sem votos', () => {
    const html = generatePoliticianPage(
      TEMPLATE,
      {
        id: 456,
        name: 'José & Cia',
        currentParty: 'MDB',
        currentState: 'MG',
        scores: { overall: 60, performanceLabel: 'Aderência moderada', totalVotes: 0 },
      },
      BASE,
      API,
    );

    expect(html).toContain('Nota 60/100 estimativa (média do partido). Sem votos nominais registrados.');
    // Sem inventar dados: não deve mencionar "votos nominais públicos"
    expect(html).not.toContain('votos nominais públicos');
  });

  it('usa logo como fallback quando photoUrl ausente', () => {
    const html = generatePoliticianPage(
      TEMPLATE,
      { id: 789, name: 'Ana Souza', currentParty: 'PL', currentState: 'RJ' },
      BASE,
      API,
    );

    expect(html).toContain(`content="${BASE}/Logo.png"`);
    expect(html).not.toContain('/api/politicians/789/photo');
  });

  it('escapa caracteres HTML no título (e.g. &)', () => {
    const html = generatePoliticianPage(
      TEMPLATE,
      { id: 10, name: 'A & B', currentParty: 'MDB', currentState: 'DF' },
      BASE,
      API,
    );

    expect(html).toContain('A &amp; B');
    expect(html).not.toContain('<title>A & B');
  });
});
