# Auditoria das redes sociais — 2026-11-01

**Objetivo:** medir o que há em `politicians.social_media_urls` antes de exibir links na ficha (Fase B de `PLANO-CONFIANCA-E-DADOS-2027.md`).
**Método:** consulta somente leitura ao banco de produção (`bancada_evangelica_db`), passagem de todos os registros pelo sanitizador `src/api/politicians/social-links.ts`, e checagem HTTP dos links de YouTube. Nenhum dado foi alterado.

## 1. Formato real gravado pelos syncs

| Casa | Fichas | Com algum link | Formato |
|---|---|---|---|
| Câmara | 648 | 391 (60%) | `{"redes": ["https://...", ...]}` (campo `redeSocial` da API da Câmara) |
| Senado | 85 | 19 (22%) | `{"website": "https://..."}` (`UrlPaginaParticular`) |

O comentário de `prisma/schema.prisma` (`{ facebook, instagram, twitter, youtube }`) **não corresponde** a esse formato. Pendente de correção.

Plataformas na Câmara: só Instagram, Facebook, Twitter e YouTube. Nenhuma outra.

## 2. O que o sanitizador faz com os dados reais

- 1.191 URLs de entrada → 1.181 links na saída (um por plataforma por ficha).
- 8 descartadas, todas comprovadamente não-perfil: `youtube.com/videos` (redireciona para tendências), `youtube.com/featured`, `youtube.com/channel` sem id (abre um canal aleatório), `youtube.com/watch?v=…` (um vídeo), `facebook.com/share` ×2 e `facebook.com/profile.php` sem id.
- 2 descartadas por duplicidade (segundo perfil da mesma plataforma).
- 209 URLs alteradas: `http`→`https`, `m.`/`pt-br.`→`www.`, remoção de rastreadores (`igshid`, `mibextid`, `utm_*`, `s`/`t`, `locale`, `lang`, `ref_src`, `view_as`) e do `#`/barra final. Twitter no formato antigo `#!/usuario` convertido.
- Fichas com ao menos um link depois de sanitizar: 410 de 733 (a mesma cobertura de antes; o sanitizador não perdeu nenhuma ficha).

**Erro encontrado e corrigido durante a auditoria:** a primeira versão do sanitizador descartava ~70 canais de YouTube no formato antigo `youtube.com/NomeDoCanal`, que são legítimos. Foi visto ao rodar contra os dados reais (os testes sintéticos passavam). Corrigido, com testes dos casos reais.

## 3. Links de YouTube que não existem mais

158 links de YouTube checados em 2026-11-01 (pausa de 0,4 s entre consultas, sem tentar contornar nada):

| Resultado | Links |
|---|---|
| 200 (existe) | 131 |
| 404 (canal inexistente) | **27 (17%)** |

Os 27 foram refeitos numa segunda passada, com outro navegador e idioma: 27 de 27 deram 404 de novo, e a página devolve `404 Not Found`. Não é bloqueio de robô. A Câmara ainda lista esses canais.

Instagram, Facebook e Twitter **não puderam ser checados**: bloqueiam consulta automatizada. O percentual de links quebrados nessas plataformas é desconhecido.

### Os 27 (id interno da ficha → URL declarada)

| Ficha | URL |
|---|---|
| 33 | `https://www.youtube.com/aluisiomendesma` |
| 61 | `https://www.youtube.com/augustopupio7945` |
| 65 | `https://www.youtube.com/bandeirademello.oficial` |
| 78 | `https://www.youtube.com/cabogilberto` |
| 115 | `https://www.youtube.com/coronelassis308` |
| 138 | `https://www.youtube.com/DanielTrzeciak` |
| 145 | `https://www.youtube.com/dayanydocapitao9613` |
| 151 | `https://www.youtube.com/delegadocaveira` |
| 179 | `https://www.youtube.com/@DrFernandoMaximo` |
| 241 | `https://www.youtube.com/filipemartinsto` |
| 315 | `https://www.youtube.com/deputadojoaodaniel` |
| 322 | `https://www.youtube.com/VEREADORJORGEBRAZ` |
| 340 | `https://www.youtube.com/julioarcoverde` |
| 341 | `https://www.youtube.com/deputadojuliocesarpi` |
| 349 | `https://www.youtube.com/deputadojuniormano` |
| 381 | `https://www.youtube.com/lucioantoniomosquinimosqui7885` |
| 402 | `https://www.youtube.com/@fernandomarangoni99` |
| 441 | `https://www.youtube.com/mauricioneves9642` |
| 443 | `https://www.youtube.com/@maxlemos9960` |
| 514 | `https://www.youtube.com/PompeodeMattos` |
| 517 | `https://www.youtube.com/PauloFernandoDF` |
| 531 | `https://www.youtube.com/reginetebispo5856` |
| 545 | `https://www.youtube.com/ricardomaiadabahia5610` |
| 553 | `https://www.youtube.com/RodolfoNogueirams` |
| 559 | `https://www.youtube.com/deputadorodrigovaladares1954` |
| 573 | `https://www.youtube.com/samiabomfimpsol` |
| 636 | `https://www.youtube.com/Yandramourase` |

## 4. O que esta auditoria NÃO provou

- Que o link de uma rede conhecida (Instagram, Facebook, Twitter) pertence mesmo ao parlamentar. O dado é o que a Câmara e o Senado publicam.
- Que os 131 canais de YouTube com resposta 200 são oficiais. Só que existem.
- Que as contas estão ativas ou sem alterações de titularidade.

## 5. Como os links quebrados passaram a ser escondidos (B4)

- **Ferramenta:** `pnpm auditar:links`. Consulta só YouTube, com `curl`, porque o `fetch` do Node desiste das respostas 200 do YouTube com "Headers Overflow" (primeira versão do script classificou os 158 como sem resposta; achado e corrigido antes de gravar qualquer coisa).
- **Regra para esconder:** 404 ou 410 em duas consultas, com navegador e idioma diferentes e 30 s de intervalo. Qualquer outra coisa é "inconclusivo" e o link continua aparecendo.
- **Resultado de 2026-11-01 (733 fichas de produção, 158 links):** 131 ok, 27 quebrados, 0 inconclusivos. Os 27 coincidem com a lista da seção 3.
- **Resultado em `socialLinks`:** 1.181 → 1.154 links; nenhuma ficha perdeu todos os links (410 fichas com ao menos um, igual a antes).
- **Lista versionada:** `src/api/politicians/links-quebrados.ts` (gerado). Revisar o diff de cada rodada antes de commitar.
- **Limite que continua valendo:** Instagram, Facebook e X não são auditáveis por robô. Links mortos nessas redes, se houver, continuam aparecendo.
