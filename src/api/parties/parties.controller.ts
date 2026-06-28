import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PartiesService } from './parties.service';

@ApiTags('parties')
@Controller('api/parties')
export class PartiesController {
  constructor(private readonly parties: PartiesService) {}

  @Get('alignment')
  @ApiOperation({ summary: 'Score médio de alinhamento por partido (≥ 3 deputados)' })
  alignment() {
    return this.parties.alignment();
  }
}
