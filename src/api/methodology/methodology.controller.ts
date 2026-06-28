import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MethodologyService } from './methodology.service';

@ApiTags('methodology')
@Controller('api/methodology')
export class MethodologyController {
  constructor(private readonly methodology: MethodologyService) {}

  @Get('pillars')
  @ApiOperation({ summary: 'Pilares da metodologia com pesos' })
  pillars() {
    return this.methodology.pillars();
  }

  @Get('content')
  @ApiOperation({ summary: 'Conteúdo textual da metodologia' })
  content() {
    return this.methodology.content();
  }

  @Get('full')
  @ApiOperation({ summary: 'Metodologia completa: pilares + conteúdo + peso total' })
  full() {
    return this.methodology.full();
  }
}
