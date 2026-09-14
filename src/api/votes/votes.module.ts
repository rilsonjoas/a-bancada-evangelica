import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { AgendasController } from './agendas.controller';
import { VotesService } from './votes.service';

@Module({ controllers: [VotesController, AgendasController], providers: [VotesService] })
export class VotesModule {}
