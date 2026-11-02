import { describe, it, expect } from 'vitest';
import { buildSocialLinks, collectSocialCandidates, sanitizeSocialUrl } from '../social-links';

/**
 * Sanitizador de redes sociais (Fase B de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Os casos abaixo vêm de URLs REAIS gravadas em `politicians.social_media_urls`
 * em produção (consulta somente leitura, 2026-11-01): parâmetros de rastreio
 * (`igshid`, `mibextid`, `s`/`t`, `utm_medium`), `http://`, `m.facebook.com`,
 * Twitter no formato antigo `#!/`, e um link de VÍDEO do YouTube posto no
 * lugar de um perfil.
 */
describe('sanitizeSocialUrl: canonicalização', () => {
  it.each([
    ['https://instagram.com/delegadodacunha?igshid=ZDdkNTZiNTM=', 'instagram', 'https://www.instagram.com/delegadodacunha'],
    ['https://instagram.com/deputadafederal_elysantos?utm_medium=copy_link', 'instagram', 'https://www.instagram.com/deputadafederal_elysantos'],
    ['https://www.instagram.com/atilalirapi/#', 'instagram', 'https://www.instagram.com/atilalirapi'],
    ['https://www.instagram.com/geraldomendesoficial/?igshid=YmMyMTA2M2Y%3D', 'instagram', 'https://www.instagram.com/geraldomendesoficial'],
    ['https://m.facebook.com/delegadodacunha?mibextid=ZbWKwL', 'facebook', 'https://www.facebook.com/delegadodacunha'],
    ['https://www.facebook.com/dep.lazaro/?locale=pt_BR', 'facebook', 'https://www.facebook.com/dep.lazaro'],
    ['https://twitter.com/adailfilhoam?s=21&t=O_eoTX0q1QfS6vmySI7biQ', 'x', 'https://twitter.com/adailfilhoam'],
    ['https://twitter.com/fredlinhares?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor', 'x', 'https://twitter.com/fredlinhares'],
    ['https://twitter.com/dpmarciomarinho?lang=pt-br', 'x', 'https://twitter.com/dpmarciomarinho'],
    ['https://youtube.com/channel/UC4YSDb1Hfh-DtR1Wj0WQNWg?view_as=subscriber', 'youtube', 'https://www.youtube.com/channel/UC4YSDb1Hfh-DtR1Wj0WQNWg'],
    ['https://www.youtube.com/@AdailFilho', 'youtube', 'https://www.youtube.com/@AdailFilho'],
    // Formato antigo `youtube.com/NomeDoCanal`: ~70 casos reais, e a maioria responde 200.
    ['https://youtube.com/celsorussomanno', 'youtube', 'https://www.youtube.com/celsorussomanno'],
    ['http://www.youtube.com/erosbiondini', 'youtube', 'https://www.youtube.com/erosbiondini'],
    ['https://youtube.com/kimkataguiri/', 'youtube', 'https://www.youtube.com/kimkataguiri'],
  ])('%s', (raw, platform, url) => {
    expect(sanitizeSocialUrl(raw)).toEqual({ platform, url });
  });

  it('sobe http:// para https:// nas plataformas conhecidas', () => {
    expect(sanitizeSocialUrl('http://twitter.com/RodrigoCastro45')).toEqual({
      platform: 'x',
      url: 'https://twitter.com/RodrigoCastro45',
    });
  });

  it('converte o formato antigo do Twitter (#!/usuario) sem perder o usuário', () => {
    expect(sanitizeSocialUrl('http://twitter.com/#!/RodrigoCastro45')).toEqual({
      platform: 'x',
      url: 'https://twitter.com/RodrigoCastro45',
    });
  });

  it('preserva maiúsculas e minúsculas do usuário, tira espaços e barra final', () => {
    expect(sanitizeSocialUrl('  https://www.facebook.com/AdailFilhoAM/  ')).toEqual({
      platform: 'facebook',
      url: 'https://www.facebook.com/AdailFilhoAM',
    });
  });

  it('aceita x.com sem trocar o domínio', () => {
    expect(sanitizeSocialUrl('https://x.com/fulano?s=20')).toEqual({ platform: 'x', url: 'https://x.com/fulano' });
  });

  it('mantém o id de facebook.com/profile.php (sem ele o link deixa de apontar para a pessoa)', () => {
    expect(sanitizeSocialUrl('https://www.facebook.com/profile.php?id=100012345678901&mibextid=x')).toEqual({
      platform: 'facebook',
      url: 'https://www.facebook.com/profile.php?id=100012345678901',
    });
  });
});

describe('sanitizeSocialUrl: o que NÃO é perfil é descartado', () => {
  it.each([
    ['vídeo do YouTube no lugar de perfil (caso real)', 'https://www.youtube.com/watch?v=BuVmJsuVjuY'],
    ['youtu.be', 'https://youtu.be/BuVmJsuVjuY'],
    ['playlist do YouTube', 'https://www.youtube.com/playlist?list=PL123'],
    ['post do Instagram', 'https://www.instagram.com/p/CxYz123/'],
    ['reel do Instagram', 'https://www.instagram.com/reel/CxYz123/'],
    ['tweet', 'https://twitter.com/fulano/status/123456'],
    ['compartilhamento do Twitter', 'https://twitter.com/intent/tweet?text=oi'],
    ['compartilhamento do Facebook', 'https://www.facebook.com/sharer/sharer.php?u=x'],
    ['YouTube /videos redireciona para tendências (caso real)', 'https://youtube.com/videos'],
    ['YouTube /featured (caso real)', 'https://youtube.com/featured'],
    ['YouTube /channel sem id leva a um canal aleatório (caso real)', 'https://youtube.com/channel'],
    ['YouTube /user sem nome', 'https://youtube.com/user'],
    ['YouTube /shorts/ID', 'https://www.youtube.com/shorts/abc123'],
    ['Facebook /share sem destino (caso real)', 'https://www.facebook.com/share'],
    ['Facebook profile.php sem id (caso real)', 'https://www.facebook.com/profile.php'],
    ['só o domínio, sem perfil', 'https://www.instagram.com/'],
    ['domínio sem caminho', 'https://twitter.com'],
  ])('%s', (_nome, raw) => {
    expect(sanitizeSocialUrl(raw)).toBeNull();
  });
});

describe('sanitizeSocialUrl: defesa contra dado malformado ou hostil', () => {
  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['sem protocolo', 'instagram.com/fulano'],
    ['credenciais embutidas', 'https://usuario:senha@www.instagram.com/fulano'],
    ['domínio parecido (sufixo sem ponto)', 'https://eviltwitter.com/fulano'],
    ['domínio que só contém o nome da rede', 'https://instagram.com.evil.example/fulano'],
    ['domínio desconhecido em rede social', 'https://orkut.com.br/fulano'],
    ['vazio', ''],
    ['só espaços', '   '],
    ['URL gigante', 'https://www.instagram.com/' + 'a'.repeat(400)],
  ])('%s', (_nome, raw) => {
    expect(sanitizeSocialUrl(raw)).toBeNull();
  });

  it.each([[null], [undefined], [42], [{}], [[]]])('valor que não é texto: %p', (raw) => {
    expect(sanitizeSocialUrl(raw as unknown)).toBeNull();
  });
});

describe('sanitizeSocialUrl: site do parlamentar (campo `website` do Senado)', () => {
  it('só é aceito quando pedido, e mantém o domínio original', () => {
    expect(sanitizeSocialUrl('https://cidgomes.com.br/')).toBeNull();
    expect(sanitizeSocialUrl('https://cidgomes.com.br/', { allowWebsite: true })).toEqual({
      platform: 'website',
      url: 'https://cidgomes.com.br/',
    });
  });

  it('mantém http:// do site pessoal (não dá para saber se o site responde em https)', () => {
    expect(sanitizeSocialUrl('http://www.senadorhumberto.com.br/', { allowWebsite: true })).toEqual({
      platform: 'website',
      url: 'http://www.senadorhumberto.com.br/',
    });
  });

  it('se o "site" na verdade é uma rede conhecida, classifica como a rede', () => {
    // Caso real: senador com `pt-br.facebook.com/...` no campo de site pessoal.
    expect(sanitizeSocialUrl('https://pt-br.facebook.com/jaqueswagneroficial/', { allowWebsite: true })).toEqual({
      platform: 'facebook',
      url: 'https://www.facebook.com/jaqueswagneroficial',
    });
  });

  it('rejeita protocolos perigosos mesmo como site', () => {
    expect(sanitizeSocialUrl('javascript:alert(1)', { allowWebsite: true })).toBeNull();
    expect(sanitizeSocialUrl('ftp://exemplo.com.br/', { allowWebsite: true })).toBeNull();
  });
});

describe('buildSocialLinks', () => {
  it('lê o formato real da Câmara ({ redes: [...] }) e devolve rótulo, URL e origem', () => {
    const links = buildSocialLinks('CAMARA', {
      redes: [
        'https://twitter.com/adailfilhoam?s=21&t=O_eoTX0q1QfS6vmySI7biQ',
        'https://www.facebook.com/AdailFilhoAM',
        'https://www.instagram.com/adailfilho/',
        'https://www.youtube.com/@AdailFilho',
      ],
    });
    expect(links).toEqual([
      { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/adailfilho', origin: 'CAMARA' },
      { platform: 'x', label: 'X (Twitter)', url: 'https://twitter.com/adailfilhoam', origin: 'CAMARA' },
      { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/AdailFilhoAM', origin: 'CAMARA' },
      { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@AdailFilho', origin: 'CAMARA' },
    ]);
  });

  it('lê o formato real do Senado ({ website: "..." })', () => {
    expect(buildSocialLinks('SENADO', { website: 'https://cidgomes.com.br/' })).toEqual([
      { platform: 'website', label: 'Site do parlamentar', url: 'https://cidgomes.com.br/', origin: 'SENADO' },
    ]);
  });

  it('um perfil por plataforma: o primeiro declarado vence', () => {
    const links = buildSocialLinks('CAMARA', {
      redes: ['https://www.facebook.com/carlos.gomesii', 'https://www.facebook.com/carlos.gomesiii'],
    });
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://www.facebook.com/carlos.gomesii');
  });

  it('descarta o que não é perfil e mantém o resto', () => {
    const links = buildSocialLinks('CAMARA', {
      redes: ['https://www.youtube.com/watch?v=BuVmJsuVjuY', 'https://www.instagram.com/fulano'],
    });
    expect(links.map((l) => l.platform)).toEqual(['instagram']);
  });

  it('o campo `website` não vale para a Câmara (a Câmara só entrega `redes`)', () => {
    expect(buildSocialLinks('CAMARA', { website: 'https://exemplo.com.br/' })).toEqual([]);
  });

  it.each([[null], [undefined], ['texto'], [123], [[]], [{}], [{ redes: 'não é lista' }], [{ redes: [null, 7, {}] }]])(
    'dado inesperado não derruba a ficha: %p',
    (raw) => {
      expect(buildSocialLinks('CAMARA', raw as unknown)).toEqual([]);
      expect(buildSocialLinks('SENADO', raw as unknown)).toEqual([]);
    },
  );
});

describe('buildSocialLinks: links comprovadamente quebrados ficam escondidos', () => {
  const quebradas = new Set(['https://www.youtube.com/DanielTrzeciak']);

  it('esconde o link quebrado e mantém os outros', () => {
    const links = buildSocialLinks(
      'CAMARA',
      { redes: ['https://www.instagram.com/danieltrzeciak45', 'https://youtube.com/DanielTrzeciak'] },
      quebradas,
    );
    expect(links.map((l) => l.platform)).toEqual(['instagram']);
  });

  it('compara pela URL já canônica (http, sem barra final, sem rastreador)', () => {
    const links = buildSocialLinks('CAMARA', { redes: ['http://youtube.com/DanielTrzeciak/?si=abc'] }, quebradas);
    expect(links).toEqual([]);
  });

  it('se o primeiro da plataforma está quebrado, o segundo declarado assume', () => {
    const links = buildSocialLinks(
      'CAMARA',
      { redes: ['https://youtube.com/DanielTrzeciak', 'https://www.youtube.com/@DanielTrzeciakOficial'] },
      quebradas,
    );
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://www.youtube.com/@DanielTrzeciakOficial');
  });

  it('a lista vazia não esconde nada', () => {
    const links = buildSocialLinks('CAMARA', { redes: ['https://youtube.com/DanielTrzeciak'] }, new Set());
    expect(links).toHaveLength(1);
  });

  it('collectSocialCandidates devolve TODOS os links válidos, inclusive o reserva', () => {
    const c = collectSocialCandidates('CAMARA', {
      redes: ['https://www.facebook.com/a', 'https://www.facebook.com/b', 'https://www.youtube.com/watch?v=x'],
    });
    expect(c.map((x) => x.url)).toEqual(['https://www.facebook.com/a', 'https://www.facebook.com/b']);
  });
});

describe('buildSocialLinks: redes declaradas ao TSE (tse_social_urls)', () => {
  const tse = (...redes: string[]) => ({ ano: 2022, redes });

  it('a casa legislativa tem prioridade; o TSE só preenche as redes que faltam', () => {
    const links = buildSocialLinks(
      'CAMARA',
      { redes: ['https://www.instagram.com/atual'] },
      new Set(),
      tse('https://www.instagram.com/de2022', 'https://www.facebook.com/fulano'),
    );
    expect(links).toEqual([
      { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/atual', origin: 'CAMARA' },
      { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/fulano', origin: 'TSE' },
    ]);
  });

  it('sem redes da casa, usa o TSE', () => {
    const links = buildSocialLinks('CAMARA', null, new Set(), tse('https://instagram.com/fulano?igshid=x'));
    expect(links).toEqual([{ platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/fulano', origin: 'TSE' }]);
  });

  it('o TSE passa pelo mesmo sanitizador (post, domínio falso, javascript:) e nunca vira "site"', () => {
    const links = buildSocialLinks(
      'CAMARA',
      null,
      new Set(),
      tse('https://www.instagram.com/p/abc', 'https://eviltwitter.com/x', 'javascript:alert(1)', 'https://meusite.com.br/'),
    );
    expect(links).toEqual([]);
  });

  it('link do TSE comprovadamente quebrado também fica escondido', () => {
    const links = buildSocialLinks('CAMARA', null, new Set(['https://www.youtube.com/DanielTrzeciak']), tse('https://youtube.com/DanielTrzeciak'));
    expect(links).toEqual([]);
  });

  it.each([[null], [undefined], ['lixo'], [42], [[]], [{}], [{ redes: 'x' }], [{ redes: [null, 7] }]])(
    'dado inesperado em tse_social_urls não derruba: %p',
    (raw) => {
      expect(buildSocialLinks('CAMARA', null, new Set(), raw as unknown)).toEqual([]);
    },
  );
});
