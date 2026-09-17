import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { initSentry, setupSentryErrorHandler } from './common/sentry';

async function bootstrap() {
  initSentry();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // Confia no proxy reverso (Traefik) para capturar o IP real do cliente
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Habilita shutdown hooks para tratar SIGTERM/SIGINT graciosamente
  app.enableShutdownHooks();

  // CORS — API pública de leitura + POST /api/contact (2026-08-16,
  // formulário de contato de verdade). Origem aberta em ambos: já era
  // assim pro GET, e o POST não tem auth/captcha mesmo — rate limit
  // (Throttle, 5/15min) é a defesa real contra abuso, não CORS.
  app.enableCors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }),
  );

  // Exception filter global — garante JSON com CORS mesmo em erros
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger / OpenAPI
  const doc = new DocumentBuilder()
    .setTitle('A Bancada Evangélica — API')
    .setDescription(
      'API de transparência parlamentar: scores de alinhamento evangélico, ' +
      'votos reais do Plenário, gastos da cota parlamentar e análise ML de clusters de votação.',
    )
    .setVersion('2.0')
    .addTag('politicians', 'Parlamentares: listagem, ranking e perfil')
    .addTag('parties',     'Alinhamento médio por partido')
    .addTag('stats',       'Estatísticas gerais da plataforma')
    .addTag('methodology', 'Pilares e critérios de avaliação')
    .addTag('health',      'Healthcheck')
    .addTag('contact',     'Formulário de contato')
    .addTag('news',        'Menções na imprensa (#7) e fila de curadoria')
    .build();

  const document = SwaggerModule.createDocument(app, doc);
  SwaggerModule.setup('api/docs', app, document);

  app.use(
    '/api/reference',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
      darkMode: true,
    }),
  );

  const port = process.env.PORT ?? 3001;

  // Guarda 500 extra do Sentry como último middleware (CEPT2-9)
  setupSentryErrorHandler(app);

  await app.listen(port);

  logger.log(`🚀 NestJS API rodando em http://localhost:${port}`);
  logger.log(`📖 Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`📖 Scalar:     http://localhost:${port}/api/reference`);
}

bootstrap();
