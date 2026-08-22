import { useEffect } from 'react';

/**
 * Métricas de audiência — decisão de arquitetura (2026-08-22):
 *
 * Escolhido: Umami auto-hospedado, MODO COOKIELESS.
 *  - Sem cookies => LGPD não exige banner de consentimento para analytics
 *    essencial/agregado; a Política de Privacidade já declara o tratamento
 *    anônimo e agregado (seção 3).
 *  - Coerente com a marca watchdog: nada de rastreamento cross-site nem
 *    publicidade; e alinhado à infraestrutura do cluster (VPS próprio).
 *
 * Por que NÃO Google Analytics: exige banner de consentimento (cookies de
 * rastreamento), pesa no carregamento, é bloqueado por ~1/3 dos navegadores
 * com adblock e conflita com a posição de privacidade do projeto. A porta
 * fica aberta: se um dia for necessário, basta trocar este componente por um
 * loader gtag gated por consentimento — mas a recomendação documentada é
 * permanecer cookieless.
 *
 * Ativação: definir VITE_UMAMI_SRC (ex.: https://umami.narniano.com/script.js)
 * e VITE_UMAMI_ID no .env do build. Sem as variáveis, nenhum script carrega.
 */
const UMAMI_SRC = import.meta.env.VITE_UMAMI_SRC as string | undefined;
const UMAMI_ID = import.meta.env.VITE_UMAMI_ID as string | undefined;

export function Analytics() {
  useEffect(() => {
    if (!UMAMI_SRC || !UMAMI_ID) return;

    const script = document.createElement('script');
    script.src = UMAMI_SRC;
    script.dataset.websiteId = UMAMI_ID;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
