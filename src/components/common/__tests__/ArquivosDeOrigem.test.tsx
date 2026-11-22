import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArquivosDeOrigem } from '../ArquivosDeOrigem';
import { CAPTURAS, type Captura } from '@/lib/capturas';

const c = (over: Partial<Captura> = {}): Captura => ({
  arquivo: 'bem_candidato_2026.zip', ano: 2026, tipo: 'Bens declarados', capturadoEm: '2026-11-02', bytes: 3_762_285,
  sha256: '3b49484f7851b2815d2247fc966e8a63fe3d4841dd3fbd8d1177e0f9367b72b8',
  urlOficial: 'https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2026.zip', observacao: 'Levantamento; ainda não importado.', ...over,
});

describe('ArquivosDeOrigem', () => {
  it('não renderiza nada sem registros', () => {
    const { container } = render(<ArquivosDeOrigem capturas={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra arquivo, data em formato brasileiro, tamanho e o SHA-256 inteiro', () => {
    render(<ArquivosDeOrigem capturas={[c()]} />);
    expect(screen.getByText('Bens declarados (2026)')).toBeInTheDocument();
    expect(screen.getByText(/Capturado em 02\/11\/2026 · 3,8 MB/)).toBeInTheDocument();
    expect(screen.getByText(c().sha256)).toBeInTheDocument();
  });

  it('com endereço: link seguro para o TSE; sem endereço: diz que não foi registrado, sem inventar link', () => {
    render(<ArquivosDeOrigem capturas={[c(), c({ sha256: 'f'.repeat(64), arquivo: 'bem_candidato_2022.zip', ano: 2022, urlOficial: null, observacao: null })]} />);
    const a = screen.getByRole('link', { name: /bem_candidato_2026\.zip/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText(/endereço de download não registrado/)).toBeInTheDocument();
  });

  it('ignora endereço que não é https', () => {
    render(<ArquivosDeOrigem capturas={[c({ urlOficial: 'http://x/y.zip' })]} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('cada arquivo é um item de lista, com o hash completo em linha própria (não cortado)', () => {
    render(<ArquivosDeOrigem capturas={[c(), c({ sha256: 'f'.repeat(64) })]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    const hash = screen.getByText(c().sha256);
    expect(hash.className).toContain('break-all');
  });

  it('avisa que hash diferente não prova alteração e que a lista não é o que já está no site', () => {
    render(<ArquivosDeOrigem capturas={[c()]} />);
    expect(screen.getByText(/e não que algo foi alterado/)).toBeInTheDocument();
    expect(screen.getByText(/não necessariamente o que já alimenta o site/)).toBeInTheDocument();
  });
});

describe('registro gerado (src/lib/capturas.ts)', () => {
  it('todo hash tem 64 hex minúsculos e nenhum se repete', () => {
    expect(CAPTURAS.length).toBeGreaterThan(0);
    for (const x of CAPTURAS) expect(x.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(CAPTURAS.map((x) => x.sha256)).size).toBe(CAPTURAS.length);
  });
  it('só há endereços https do CDN do TSE', () => {
    for (const x of CAPTURAS) if (x.urlOficial) expect(x.urlOficial.startsWith('https://cdn.tse.jus.br/')).toBe(true);
  });
});
