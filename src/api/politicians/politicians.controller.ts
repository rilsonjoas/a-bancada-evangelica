import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PoliticiansService } from './politicians.service';
import { QueryPoliticiansDto } from './dto/query-politicians.dto';
import { QueryRankingDto } from './dto/query-ranking.dto';

@ApiTags('politicians')
@Controller('api/politicians')
export class PoliticiansController {
  constructor(private readonly politicians: PoliticiansService) {}

  @Get()
  @ApiOperation({ summary: 'Lista de parlamentares com filtros e paginação' })
  findAll(@Query() query: QueryPoliticiansDto) {
    return this.politicians.findAll(query);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Ranking ordenado por pontuação ou critério específico' })
  ranking(@Query() query: QueryRankingDto) {
    return this.politicians.ranking(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Perfil completo: score, votos recentes, análise de gastos' })
  @ApiParam({ name: 'id', description: 'ID do parlamentar' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.politicians.findOne(id);
  }
}
