import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VotesService } from './votes.service';

/**
 * Rotas de pautas-chave vivas fora do prefixo /api/votes porque o
 * frontend as consome como /api/agendas/... (contrato original da UI).
 */
@ApiTags('votes')
@Controller('api/agendas')
export class AgendasController {
  constructor(private readonly votes: VotesService) {}

  /**
   * Votos individuais reais de uma pauta — GT1 (integridade de dados).
   * A UI consome este shape; antes o endpoint não existia e o front
   * caía num fallback que fabricava parlamentares e contagens. Agora
   * serve apenas votos gravados no banco; pauta sem voto retorna lista
   * vazia ("0 honesto > número fabricado").
   */
  @Get(':agendaId/votes')
  @ApiOperation({ summary: 'Votos individuais reais de uma pauta-chave (auditável)' })
  async agendaVotes(@Param('agendaId') agendaId: string) {
    const data = await this.votes.agendaVotes(agendaId);
    if (!data) throw new NotFoundException('Pauta não encontrada');
    return data;
  }
}