import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Estatísticas gerais: total, distribuição de performance, casas' })
  overview() {
    return this.stats.overview();
  }

  @Get('last-sync')
  @ApiOperation({ summary: 'Data/hora da última sincronização bem-sucedida' })
  lastSync() {
    return this.stats.lastSync();
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Histórico de auditoria das sincronizações — inclui diff das notas por recálculo (H6)' })
  syncHistory(@Query('limit') limit?: string) {
    return this.stats.syncHistory(limit ? parseInt(limit, 10) : 50);
  }
}
