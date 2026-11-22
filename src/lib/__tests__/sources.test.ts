import { describe, expect, it } from 'vitest';
import { FONTES_DE_DADOS, buildDivulgaCandLink, buildExpenseLink, buildPoliticianProfileLink, buildVoteSourceLink } from '../sources';

describe('buildPoliticianProfileLink', () => {
  it('monta a página oficial do deputado na Câmara', () => {
    expect(
      buildPoliticianProfileLink({ house: 'CAMARA', legislatureId: '204379' }),
    ).toEqual({
      url: 'https://www.camara.leg.br/deputados/204379',
      label: 'Ver perfil na Câmara dos Deputados',
    });
  });

  it('monta a página oficial do senador no Senado', () => {
    expect(
      buildPoliticianProfileLink({ house: 'SENADO', legislatureId: '5672' }),
    ).toEqual({
      url: 'https://www25.senado.leg.br/web/senadores/senador/-/perfil/5672',
      label: 'Ver perfil no Senado Federal',
    });
  });

  it('não devolve link quando falta o identificador', () => {
    expect(buildPoliticianProfileLink({ house: 'CAMARA', legislatureId: null })).toEqual({
      url: null,
      label: '',
    });
    expect(buildPoliticianProfileLink({ house: 'SENADO', legislatureId: '' })).toEqual({
      url: null,
      label: '',
    });
  });

  it('recusa identificador que não seja só dígitos (nada vai para a URL sem validar)', () => {
    for (const bad of ['204379/../x', '20 4379', '204379?a=1', 'abc', '<script>']) {
      expect(buildPoliticianProfileLink({ house: 'CAMARA', legislatureId: bad }).url).toBeNull();
    }
  });

  it('recusa casa desconhecida', () => {
    expect(
      buildPoliticianProfileLink({ house: 'OUTRA' as never, legislatureId: '1' }).url,
    ).toBeNull();
  });
});

describe('buildExpenseLink', () => {
  it('Câmara: página de gastos filtrada pelo deputado', () => {
    expect(buildExpenseLink({ house: 'CAMARA', legislatureId: '204379' })).toEqual({
      url: 'https://www.camara.leg.br/transparencia/gastos-parlamentares?deputado=204379',
      label: 'Ver gastos na Câmara dos Deputados',
    });
  });
  it('Senado: página de transparência do senador', () => {
    expect(buildExpenseLink({ house: 'SENADO', legislatureId: '3806' })).toEqual({
      url: 'https://www6g.senado.leg.br/transparencia/sen/3806/',
      label: 'Ver gastos no Senado Federal',
    });
  });
  it('nunca usa a URL /cota-parlamentar da Câmara (404)', () => {
    expect(buildExpenseLink({ house: 'CAMARA', legislatureId: '1' }).url).not.toContain('/cota-parlamentar');
  });
  it.each([[null], [undefined], [''], ['  '], ['12a'], ['1/../2'], ['1?x=2'], ['<script>']])(
    'id inválido (%p): sem link',
    (id) => {
      expect(buildExpenseLink({ house: 'CAMARA', legislatureId: id as string | null }).url).toBeNull();
      expect(buildExpenseLink({ house: 'SENADO', legislatureId: id as string | null }).url).toBeNull();
    },
  );
});

describe('buildVoteSourceLink (comportamento existente)', () => {
  it('segue sem link quando a fonte é manual', () => {
    expect(buildVoteSourceLink({ source: 'MANUAL', sourcePropositionId: '1' }).url).toBeNull();
  });
});

describe('FONTES_DE_DADOS (catálogo exibido em /dados)', () => {
  it('não está vazio e cada fonte tem nome, endereço e o que fornece', () => {
    expect(FONTES_DE_DADOS.length).toBeGreaterThan(0);
    for (const f of FONTES_DE_DADOS) {
      expect(f.nome.trim()).not.toBe('');
      expect(f.fornece.trim()).not.toBe('');
      expect(f.url).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it('não repete id nem endereço', () => {
    const ids = FONTES_DE_DADOS.map((f) => f.id);
    const urls = FONTES_DE_DADOS.map((f) => f.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('cobre as três origens do dado: Câmara, Senado e TSE', () => {
    const hosts = FONTES_DE_DADOS.map((f) => new URL(f.url).hostname);
    expect(hosts.some((h) => h.endsWith('camara.leg.br'))).toBe(true);
    expect(hosts.some((h) => h.endsWith('senado.leg.br') || h.endsWith('senado.gov.br'))).toBe(true);
    expect(hosts.some((h) => h.endsWith('tse.jus.br'))).toBe(true);
  });
});

describe('buildDivulgaCandLink (A5: link oficial ao espelho do candidato no TSE)', () => {
  it('monta o link correto para candidato de 2022 em PE', () => {
    expect(
      buildDivulgaCandLink({ state: 'PE', sqCandidato: '170001604083', electionYear: 2022 }),
    ).toEqual({
      url: 'https://divulgacandcontas.tse.jus.br/divulga/#/candidato/NORDESTE/PE/2040602022/170001604083/2022/PE',
      label: 'Ver no DivulgaCandContas (TSE)',
    });
  });

  it('monta o link correto para candidato de 2026 no DF', () => {
    expect(
      buildDivulgaCandLink({ state: 'DF', sqCandidato: '70002552934', electionYear: 2026 }),
    ).toEqual({
      url: 'https://divulgacandcontas.tse.jus.br/divulga/#/candidato/CENTROOESTE/DF/20322002026/70002552934/2026/DF',
      label: 'Ver no DivulgaCandContas (TSE)',
    });
  });

  it('monta o link correto para candidato de 2018 em SP (senador 2018)', () => {
    expect(
      buildDivulgaCandLink({ state: 'SP', sqCandidato: '250000600000', electionYear: 2018 }),
    ).toEqual({
      url: 'https://divulgacandcontas.tse.jus.br/divulga/#/candidato/SUDESTE/SP/2022802018/250000600000/2018/SP',
      label: 'Ver no DivulgaCandContas (TSE)',
    });
  });

  it('suporta circunscrição nacional (BR)', () => {
    expect(
      buildDivulgaCandLink({ state: 'BR', sqCandidato: '280002542548', electionYear: 2026 }),
    ).toEqual({
      url: 'https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026/280002542548/2026/BR',
      label: 'Ver no DivulgaCandContas (TSE)',
    });
  });

  it('assume ano 2022 por padrão quando electionYear não for especificado', () => {
    expect(
      buildDivulgaCandLink({ state: 'pe', sqCandidato: '170001604083' }),
    ).toEqual({
      url: 'https://divulgacandcontas.tse.jus.br/divulga/#/candidato/NORDESTE/PE/2040602022/170001604083/2022/PE',
      label: 'Ver no DivulgaCandContas (TSE)',
    });
  });

  it('recusa entrada inválida ou faltante', () => {
    expect(buildDivulgaCandLink({ state: null, sqCandidato: '170001604083' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: null }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '  ' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '170abc' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '<script>' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '170/../2' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'XX', sqCandidato: '170001604083' }).url).toBeNull();
    expect(buildDivulgaCandLink({ state: 'PE', sqCandidato: '170001604083', electionYear: 1990 }).url).toBeNull();
  });
});
