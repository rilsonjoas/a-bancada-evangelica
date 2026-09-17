import * as Sentry from '@sentry/node';
import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

/**
 * Inicializa o Sentry apenas quando SENTRY_DSN existe no ambiente.
 * Sem o DSN (dev local, testes), o SDK fica inerte — zero custo.
 * CEPT2-9: monitoramento de runtime p/ classe de bug que build+tests
 * não pegam (ex.: tela-branca TDZ 16/09 e 23/08).
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.log('SENTRY_DSN ausente — monitoramento desativado.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0,
    release: process.env.SENTRY_RELEASE ?? undefined,
  });

  logger.log(`Sentry ativo (env=${process.env.NODE_ENV ?? 'development'}).`);
}

export function sentryEnabled(): boolean {
  return Sentry.isInitialized();
}

/**
 * Guarda externo de erros da API; deve ser o ÚLTIMO middleware.
 */
export function setupSentryErrorHandler(app: { getHttpAdapter: () => { getInstance: () => unknown } }): void {
  if (!sentryEnabled()) return;
  try {
    const instance = app.getHttpAdapter().getInstance() as Parameters<typeof Sentry.setupExpressErrorHandler>[0];
    Sentry.setupExpressErrorHandler(instance);
  } catch (err) {
    logger.warn(`Falha ao anexar error handler do Sentry: ${String(err)}`);
  }
}

export function captureException(exception: unknown): void {
  if (!sentryEnabled()) return;
  Sentry.captureException(exception);
}