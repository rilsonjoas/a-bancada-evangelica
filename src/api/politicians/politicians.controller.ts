import { Controller, Get, Param, Query, ParseIntPipe, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
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

  /**
   * Proxy same-origin das fotos institucionais (Câmara/Senado).
   * Motivo real (2026-08-21): html2canvas descarta imagens cross-origin
   * mesmo com useCORS — os servidores do parlamento não mandam headers
   * CORS — e as fotos saíam brancas no card compartilhável. Servindo a
   * imagem pelo próprio domínio da API, o canvas rasteriza normal.
   */
  @Get(':id/photo')
  @ApiOperation({ summary: 'Foto do parlamentar servida same-origin (proxy para canvas/compartilhamento)' })
  async photo(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const url = await this.politicians.photoUrlOf(id);
    if (!url) throw new NotFoundException('Parlamentar sem foto cadastrada');

    try {
      const upstream = await fetch(url, { redirect: 'follow' });
      if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.set({
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        // Foto institucional muda raramente — cache agressivo no edge/navegador
        'Cache-Control': 'public, max-age=604800',
      });
      res.end(buffer);
    } catch {
      throw new NotFoundException('Foto indisponível na fonte oficial');
    }
  }
}
