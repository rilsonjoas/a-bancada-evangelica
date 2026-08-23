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
  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar ranking CSV — dados abertos da bancada' })
  @ApiQuery({ name: 'criteria', required: false, enum: ['overall', 'lifeProtection', 'familyValues', 'moralIntegrity', 'socialResponsibility', 'religiousFreedom'], description: 'Critério de ordenação' })
  async exportCsv(@Query() query: QueryRankingDto, @Res() res: Response) {
    const politicians = await this.politicians.ranking({
      ...query,
      limit: '200',
    });

    const header = 'ID,Nome,Partido,Estado,Casa,Score Geral,' +
      'Life Protection,Family Values,Moral Integrity,Social Responsibility,Religious Freedom\n';

    const rows = politicians.map((p, i) => {
      const s = p.scores?.[0] || {};
      const fields = [
        p.id,
        `"${p.name.replace(/"/, '""')}"`,
        `"${p.party?.replace(/"/, '""')}"`,
        `"${p.state?.replace(/"/, '""')}"`,
        p.current_house ?? '',
        s.overall_score ?? 0,
        s.life_protection ?? 0,
        s.family_values ?? 0,
        s.moral_integrity ?? 0,
        s.social_responsibility ?? 0,
        s.religious_freedom ?? 0,
      ];
      return fields.map(f => `"${f}"`).join(',');
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bancada-evangelica-ranking.csv"');
    res.status(200).send([header, ...rows].join('\n'));
  }

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
