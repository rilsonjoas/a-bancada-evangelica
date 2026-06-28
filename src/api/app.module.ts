import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    PoliticiansModule,
    PartiesModule,
    StatsModule,
    MethodologyModule,
    HealthModule,
    VotesModule,
  ],
})
export class AppModule {}
