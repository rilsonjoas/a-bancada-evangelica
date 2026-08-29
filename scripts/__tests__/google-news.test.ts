import { describe, it, expect } from 'vitest';
import {
  parseRss,
  splitTitleSource,
  buildNewsQuery,
  googleNewsFeedUrl,
  type NewsItem,
} from '../lib/google-news';

describe('splitTitleSource', () => {
  it('separa título editorial e fonte no padrão "- Fonte"', () => {
    expect(splitTitleSource('Deputado X vota contra o projeto - Folha de S.Paulo')).toEqual({
      title: 'Deputado X vota contra o projeto',
      source: 'Folha de S.Paulo',
    });
  });

  it('mantém título inteiro quando não há padrão de fonte', () => {
    expect(splitTitleSource('Deputado X vota contra o projeto')).toEqual({
      title: 'Deputado X vota contra o projeto',
      source: null,
    });
  });

  it('fonte com hífen interno não quebra o split', () => {
    expect(splitTitleSource('Projeto aprovado - Correio Braziliense')).toEqual({
      title: 'Projeto aprovado',
      source: 'Correio Braziliense',
    });
  });
});

describe('parseRss', () => {
  const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title><![CDATA[Deputado Fulano propõe projeto - Folha de S.Paulo]]></title>
      <link>https://www1.folha.uol.com.br/poder/2026/08/artigo.shtml</link>
      <pubDate>Wed, 26 Aug 2026 14:30:00 GMT</pubDate>
      <source url="https://www1.folha.uol.com.br">Folha de S.Paulo</source>
    </item>
    <item>
      <title>Entrevista com Sicrano - Correio Braziliense</title>
      <link>https://www.correiobraziliense.com.br/noticia.shtml</link>
      <pubDate>Thu, 27 Aug 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Sem link não presta para o produto</title>
      <pubDate>Thu, 27 Aug 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  it('extrai itens com link e separa título/fonte/pubDate', () => {
    const items = parseRss(SAMPLE);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: 'Deputado Fulano propõe projeto',
      link: 'https://www1.folha.uol.com.br/poder/2026/08/artigo.shtml',
      source: 'Folha de S.Paulo',
      pubDate: 'Wed, 26 Aug 2026 14:30:00 GMT',
    });
    expect(items[1].title).toBe('Entrevista com Sicrano');
    expect(items[1].source).toBe('Correio Braziliense');
  });

  it('decodifica entidades XML básicas', () => {
    const xml = `<rss><channel><item>
      <title>Lei de &amp;quot;Combate&amp;quot; &amp; Política &lt;x&gt; - Fonte A</title>
      <link>https://ex.com/a</link>
      <pubDate>Wed, 26 Aug 2026 14:30:00 GMT</pubDate>
    </item></channel></rss>`;
    const [item] = parseRss(xml);
    expect(item.title).toBe('Lei de "Combate" & Política <x>');
  });

  it('lida com CDATA no título e com fonte no <source>', () => {
    const xml = `<rss><channel><item>
      <title><![CDATA[Política em foco - Rádio CBN]]></title>
      <link>https://ex.com/b</link>
      <pubDate>Wed, 26 Aug 2026 14:30:00 GMT</pubDate>
    </item></channel></rss>`;
    const [item] = parseRss(xml);
    expect(item.title).toBe('Política em foco');
    expect(item.source).toBe('Rádio CBN');
  });

  it('retorna lista vazia para XML sem items', () => {
    expect(parseRss('<rss><channel></channel></rss>')).toEqual([]);
  });
});

describe('buildNewsQuery / googleNewsFeedUrl', () => {
  it('monta query com nome entre aspas + partido + UF', () => {
    expect(buildNewsQuery({ name: 'João da Silva', party: 'PL', state: 'SP' })).toBe(
      '"João da Silva" PL SP',
    );
  });

  it('omite partido/UF quando ausentes', () => {
    expect(buildNewsQuery({ name: 'Maria Souza' })).toBe('"Maria Souza"');
  });

  it('gera URL RSS comhl pt-BR e termo codificado', () => {
    const url = googleNewsFeedUrl('"João da Silva" PL SP');
    expect(url).toContain('news.google.com/rss/search');
    expect(url).toContain(encodeURIComponent('"João da Silva" PL SP'));
    expect(url).toContain('hl=pt-BR&gl=BR&ceid=BR:pt-419');
  });
});