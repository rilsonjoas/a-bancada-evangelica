import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // CORS — API pública de leitura
  app.enableCors({ origin: '*', methods: ['GET', 'OPTIONS'] });

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
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 NestJS API rodando em http://localhost:${port}`);
  logger.log(`📖 Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
