import { Controller, Get, Param, Query, ParseIntPipe, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
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

  /**
   * Open data (2026-08-23): CSV do ranking completo.
   * Rota ESTÁTICA declarada ANTES de @Get(':id') — NestJS casa rotas em
   * ordem de declaração; depois de :id, o ParseIntPipe capturava "export"
   * e respondia 400 antes de chegar aqui (achado real do primeiro deploy).
   */
  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar ranking em CSV — dados abertos para jornalistas/pesquisadores' })
  @ApiQuery({ name: 'criteria', required: false, enum: ['overall', 'lifeProtection', 'familyValues', 'moralIntegrity', 'socialResponsibility', 'religiousFreedom'], description: 'Critério de ordenação' })
  async exportCsv(@Query() query: QueryRankingDto, @Res() res: Response) {
    const politicians = await this.politicians.ranking({ ...query, limit: '200' });

    // Shape real do retorno de ranking(): { politician: {...}, score: {overall, lifeProtection, ...}, position }
    // (o primeiro rascunho lia p.scores[0] — campo que não existe nesse shape — e sairia zerado)
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header =
      'Posição,Nome,Partido,Estado,Casa,Nota Geral,' +
      'Proteção à Vida,Defesa da Família,Integridade Moral,Responsabilidade Social,Liberdade Religiosa\n';

    const rows = politicians.map((r) => {
      // Fallback tipado com o mesmo shape de formatScore() — `{}` nu
      // derruba a inferência e o tsc reprova cada acesso abaixo
      const sc = r.score ?? {
        overall: 0,
        lifeProtection: 0,
        familyValues: 0,
        moralIntegrity: 0,
        socialResponsibility: 0,
        religiousFreedom: 0,
      };
      const fields: Array<string | number> = [
        r.position,
        esc(r.politician?.name),
        esc(r.politician?.currentParty),
        esc(r.politician?.currentState),
        r.politician?.currentHouse ?? '',
        sc.overall ?? 0,
        sc.lifeProtection ?? 0,
        sc.familyValues ?? 0,
        sc.moralIntegrity ?? 0,
        sc.socialResponsibility ?? 0,
        sc.religiousFreedom ?? 0,
      ];
      return fields.join(',');
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="bancada-evangelica-ranking.csv"',
    );
    // BOM (\uFEFF) para o Excel abrir acentuação corretamente
    res.status(200).send('\uFEFF' + header + rows.join('\n'));
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
