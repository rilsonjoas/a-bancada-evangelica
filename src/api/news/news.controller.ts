import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { AdminTokenGuard } from './admin-token.guard';
import { NewsStatus } from '@prisma/client';

const STATUSES: ('APPROVED' | 'REJECTED')[] = ['APPROVED', 'REJECTED'];

@ApiTags('news')
@Controller('api/news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  // ── Público: menções aprovadas de um parlamentar (`NewsMention` com status APPROVED) ──
  @Get('politicians/:politicianId')
  @ApiOperation({ summary: 'Menções na imprensa do parlamentar (só aprovadas na curadoria)' })
  @ApiParam({ name: 'politicianId', type: Number })
  findByPolitician(@Param('politicianId', ParseIntPipe) politicianId: number) {
    return this.news.findByPolitician(politicianId);
  }

  // ── Curadoria (admin): fila pendente ──
  @Get('admin/pending')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: 'Fila de curadoria: menções ainda não revisadas' })
  pending() {
    return this.news.pending();
  }

  // ── Curadoria (admin): contagem real da fila (Eixo 2 do plano de
  // operação sustentável) — pending() acima trunca em 100, isso aqui é
  // o total de verdade pro badge da fila não escamotear backlog. ──
  @Get('admin/pending/count')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: 'Contagem total de menções pendentes (sem truncar em 100)' })
  async pendingCount() {
    return { count: await this.news.pendingCount() };
  }

  // ── Curadoria (admin): decidir em lote (batch approve/reject) ──
  @Post('admin/batch-review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: 'Revisa várias menções em lote: APPROVED ou REJECTED' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number' } },
        status: { type: 'string', enum: STATUSES },
      },
    },
  })
  async batchReview(
    @Body('ids') ids: number[] | undefined,
    @Body('status') status: string | undefined,
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids deve ser um array não-vazio de números');
    }
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new BadRequestException('status deve ser APPROVED ou REJECTED');
    }
    return this.news.batchReview(ids, status as (typeof STATUSES)[number]);
  }

  // ── Curadoria (admin): decidir (approve/reject) ──
  @Post('admin/:id/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: 'Revisa uma menção: APPROVED ou REJECTED (decisão humana)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: { type: 'object', properties: { status: { type: 'string', enum: STATUSES } } },
  })
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string | undefined,
  ) {
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new BadRequestException('status deve ser APPROVED ou REJECTED');
    }
    const updated = await this.news.review(id, status as (typeof STATUSES)[number]);
    if (!updated) throw new NotFoundException(`Menção ${id} não encontrada`);
    return updated;
  }
}