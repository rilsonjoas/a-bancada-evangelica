import { Module } from '@nestjs/common';
import { PoliticiansController } from './politicians.controller';
import { PoliticiansService } from './politicians.service';

@Module({
  controllers: [PoliticiansController],
  providers: [PoliticiansService],
})
export class PoliticiansModule {}
