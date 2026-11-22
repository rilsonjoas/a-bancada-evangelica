import { describe, it, expect } from 'vitest';
import { CDN_TSE, inferirArquivo, mesclar, renderizarCapturas, SHA256_RE, type Captura } from '../lib/capturas';

const cap = (over: Partial<Captura> = {}): Captura => ({
  arquivo: 'a.zip', ano: 2022, tipo: 'T', capturadoEm: '2026-08-20', bytes: 1, sha256: 'a'.repeat(64), urlOficial: null, observacao: null, ...over,
});

describe('inferirArquivo', () => {
  it.each([
    ['consulta_cand_2022.zip', 2022, 'Candidaturas e resultado'],
    ['consulta_cand_complementar_2022.zip', 2022, 'Candidaturas (complementar)'],
    ['bem_candidato_2026.zip', 2026, 'Bens declarados'],
    ['rede_social_candidato_2018.zip', 2018, 'Redes sociais declaradas'],
    ['prestacao_de_contas_eleitorais_candidatos_2022.zip', 2022, 'Prestação de contas (receitas e despesas)'],
    ['motivo_cassacao_2022.zip', 2022, 'Motivos de cassação'],
  ])('%s -> %s / %s', (nome, ano, tipo) => {
    const r = inferirArquivo(nome)!;
    expect(r.ano).toBe(ano);
    expect(r.tipo).toBe(tipo);
  });

  it('o complementar não é confundido com a candidatura principal', () => {
    expect(inferirArquivo('consulta_cand_complementar_2022.zip')!.tipo).toBe('Candidaturas (complementar)');
  });

  it('nome desconhecido ou fora do padrão: null', () => {
    expect(inferirArquivo('foto.zip')).toBeNull();
    expect(inferirArquivo('consulta_cand_22.zip')).toBeNull();
    expect(inferirArquivo('consulta_cand_2022.zip.bak')).toBeNull();
  });

  it('baixado do CDN em 2026-11-02: monta o endereço da pasta certa', () => {
    expect(inferirArquivo('2026/bem_candidato_2026.zip')!.urlOficial).toBe(`${CDN_TSE}/bem_candidato/bem_candidato_2026.zip`);
    expect(inferirArquivo('2026/rede_social_candidato_2026.zip')!.urlOficial).toBe(`${CDN_TSE}/consulta_cand/rede_social_candidato_2026.zip`);
    expect(inferirArquivo('2022-republicado/prestacao_de_contas_eleitorais_candidatos_2022.zip')!.urlOficial).toBe(
      `${CDN_TSE}/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip`,
    );
    expect(inferirArquivo('rede_social_candidato_2022.zip')!.urlOficial).toBe(`${CDN_TSE}/consulta_cand/rede_social_candidato_2022.zip`);
  });

  it('baixado antes do registro (agosto): sem endereço, nunca um palpite', () => {
    expect(inferirArquivo('bem_candidato_2022.zip')!.urlOficial).toBeNull();
    expect(inferirArquivo('prestacao_de_contas_eleitorais_candidatos_2022.zip')!.urlOficial).toBeNull();
  });

  it('pasta do CDN desconhecida (motivo de cassação, complementar): sem endereço mesmo na pasta 2026', () => {
    expect(inferirArquivo('2026/motivo_cassacao_2026.zip')!.urlOficial).toBeNull();
    expect(inferirArquivo('2026/consulta_cand_complementar_2026.zip')!.urlOficial).toBeNull();
  });

  it('2018 (levantamento): CDN e marca de não importado', () => {
    const r = inferirArquivo('2018/consulta_cand_2018.zip')!;
    expect(r.urlOficial).toBe(`${CDN_TSE}/consulta_cand/consulta_cand_2018.zip`);
    expect(r.observacao).toMatch(/ainda não importado/);
  });

  it('marca o que foi só levantamento', () => {
    expect(inferirArquivo('2026/bem_candidato_2026.zip')!.observacao).toMatch(/ainda não importado/);
    expect(inferirArquivo('2022-republicado/bem_candidato_2022.zip')!.observacao).toMatch(/republicada/);
    expect(inferirArquivo('bem_candidato_2022.zip')!.observacao).toBeNull();
  });
});

describe('mesclar', () => {
  it('mesmo conteúdo achado de novo não duplica e preserva data e endereço já registrados', () => {
    const antes = cap({ capturadoEm: '2026-08-20', urlOficial: 'https://x/y.zip' });
    const r = mesclar([antes], [cap({ capturadoEm: '2026-11-05', urlOficial: null })]);
    expect(r).toHaveLength(1);
    expect(r[0].capturadoEm).toBe('2026-08-20');
    expect(r[0].urlOficial).toBe('https://x/y.zip');
  });
  it('conteúdo diferente com o mesmo nome vira outra linha (arquivo republicado)', () => {
    const r = mesclar([cap({ sha256: 'a'.repeat(64) })], [cap({ sha256: 'b'.repeat(64), capturadoEm: '2026-11-02' })]);
    expect(r).toHaveLength(2);
  });
  it('arquivo que sumiu do disco continua registrado (o registro é histórico)', () => {
    expect(mesclar([cap()], [])).toHaveLength(1);
  });
  it('ordena do ano mais novo para o mais antigo, depois por tipo e data', () => {
    const r = mesclar([], [cap({ ano: 2018, sha256: '1'.repeat(64) }), cap({ ano: 2026, sha256: '2'.repeat(64) }), cap({ ano: 2022, sha256: '3'.repeat(64) })]);
    expect(r.map((c) => c.ano)).toEqual([2026, 2022, 2018]);
  });
});

describe('renderizarCapturas', () => {
  it('lista vazia gera array vazio válido', () => {
    expect(renderizarCapturas([])).toContain('CAPTURAS: ReadonlyArray<Captura> = [];');
  });
  it('escapa texto como literal e avisa que é arquivo gerado', () => {
    const src = renderizarCapturas([cap({ observacao: 'tem "aspas"' })]);
    expect(src).toContain('"tem \\"aspas\\""');
    expect(src).toContain('ARQUIVO GERADO');
  });
  it('SHA256_RE só aceita 64 hex minúsculos', () => {
    expect(SHA256_RE.test('a'.repeat(64))).toBe(true);
    expect(SHA256_RE.test('A'.repeat(64))).toBe(false);
    expect(SHA256_RE.test('a'.repeat(63))).toBe(false);
  });
});
