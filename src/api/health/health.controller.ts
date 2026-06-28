import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Healthcheck para Railway' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
