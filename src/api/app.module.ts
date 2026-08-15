import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { PoliticiansModule } from './politicians/politicians.module';
import { PartiesModule } from './parties/parties.module';
import { StatsModule } from './stats/stats.module';
import { MethodologyModule } from './methodology/methodology.module';
import { HealthModule } from './health/health.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,   // Janela de 1 minuto (60000ms)
      limit: 100,  // Max 100 requisições por IP
    }]),
    PrismaModule,
    PoliticiansModule,
    PartiesModule,
    StatsModule,
    MethodologyModule,
    HealthModule,
    VotesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
