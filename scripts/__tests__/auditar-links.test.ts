import { describe, it, expect } from 'vitest';
import { auditavel, novaLista, renderizarArquivo, veredito } from '../lib/auditar-links';

describe('veredito: só se esconde com prova', () => {
  it('200 na primeira: ok, sem precisar de segunda consulta', () => {
    expect(veredito({ status: 200 }, null)).toBe('ok');
  });
  it('404 nas duas consultas: quebrado', () => {
    expect(veredito({ status: 404 }, { status: 404 })).toBe('quebrado');
  });
  it('410 e 404 também contam como ausência', () => {
    expect(veredito({ status: 410 }, { status: 404 })).toBe('quebrado');
  });
  it('404 na primeira e 200 na segunda: o link funciona', () => {
    expect(veredito({ status: 404 }, { status: 200 })).toBe('ok');
  });
  it('404 na primeira e sem segunda consulta: inconclusivo (nunca esconde com uma só)', () => {
    expect(veredito({ status: 404 }, null)).toBe('inconclusivo');
  });
  it.each([[403], [429], [500], [503], [null]])('%p nas duas consultas: inconclusivo', (s) => {
    expect(veredito({ status: s }, { status: s })).toBe('inconclusivo');
  });
  it('404 e depois erro de rede: inconclusivo', () => {
    expect(veredito({ status: 404 }, { status: null })).toBe('inconclusivo');
  });
  it('404 e depois 500: inconclusivo', () => {
    expect(veredito({ status: 404 }, { status: 500 })).toBe('inconclusivo');
  });
});

describe('novaLista', () => {
  const antigo = [
    { url: 'https://www.youtube.com/a', status: 404, verificadoEm: '2026-01-01' },
    { url: 'https://www.youtube.com/b', status: 404, verificadoEm: '2026-01-01' },
    { url: 'https://www.youtube.com/c', status: 404, verificadoEm: '2026-01-01' },
    { url: 'https://www.youtube.com/sumiu', status: 404, verificadoEm: '2026-01-01' },
  ];
  const res = new Map([
    ['https://www.youtube.com/a', { veredito: 'ok' as const, status: 200 }],
    ['https://www.youtube.com/b', { veredito: 'inconclusivo' as const, status: 503 }],
    ['https://www.youtube.com/c', { veredito: 'quebrado' as const, status: 404 }],
    ['https://www.youtube.com/novo', { veredito: 'quebrado' as const, status: 410 }],
    ['https://www.youtube.com/bom', { veredito: 'ok' as const, status: 200 }],
  ]);
  const r = novaLista(antigo, res, '2026-11-01');

  it('quem voltou a funcionar sai da lista', () => {
    expect(r.find((e) => e.url.endsWith('/a'))).toBeUndefined();
  });
  it('inconclusivo mantém a entrada anterior, com a data antiga', () => {
    expect(r.find((e) => e.url.endsWith('/b'))).toEqual(antigo[1]);
  });
  it('quebrado confirmado de novo ganha data nova; quebrado novo entra', () => {
    expect(r.find((e) => e.url.endsWith('/c'))).toEqual({ url: 'https://www.youtube.com/c', status: 404, verificadoEm: '2026-11-01' });
    expect(r.find((e) => e.url.endsWith('/novo'))).toEqual({ url: 'https://www.youtube.com/novo', status: 410, verificadoEm: '2026-11-01' });
  });
  it('link que não existe mais nos dados sai', () => {
    expect(r.find((e) => e.url.endsWith('/sumiu'))).toBeUndefined();
  });
  it('ok que nunca esteve na lista não entra; saída ordenada', () => {
    expect(r.find((e) => e.url.endsWith('/bom'))).toBeUndefined();
    expect(r.map((e) => e.url)).toEqual([...r.map((e) => e.url)].sort());
  });
});

describe('renderizarArquivo', () => {
  it('lista vazia gera array vazio válido', () => {
    expect(renderizarArquivo([])).toContain('LINKS_QUEBRADOS: ReadonlyArray<LinkQuebrado> = [];');
  });
  it('escapa as URLs como string literal', () => {
    const src = renderizarArquivo([{ url: 'https://www.youtube.com/a"b', status: 404, verificadoEm: '2026-11-01' }]);
    expect(src).toContain('"https://www.youtube.com/a\\"b"');
  });
  it('registra que o arquivo é gerado', () => {
    expect(renderizarArquivo([])).toContain('ARQUIVO GERADO');
  });
});

describe('auditavel', () => {
  it('só YouTube', () => {
    expect(auditavel('https://www.youtube.com/@x')).toBe(true);
    expect(auditavel('https://www.instagram.com/x')).toBe(false);
    expect(auditavel('https://www.facebook.com/x')).toBe(false);
    expect(auditavel('https://eviltube.com/x')).toBe(false);
    expect(auditavel('lixo')).toBe(false);
  });
});
