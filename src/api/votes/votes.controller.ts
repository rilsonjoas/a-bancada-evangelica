import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VotesService } from './votes.service';

@ApiTags('votes')
@Controller('api/votes')
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Get('analysis')
  @ApiOperation({ summary: 'Análise agregada de votações: timeline, critérios, pautas-chave' })
  analysis() { return this.votes.analysis(); }
}
