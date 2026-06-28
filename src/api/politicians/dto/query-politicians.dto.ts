import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryPoliticiansDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou partido' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sigla do estado (ex: SP, RJ)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Sigla do partido (ex: PL, PT)' })
  @IsOptional()
  @IsString()
  party?: string;

  @ApiPropertyOptional({ enum: ['CAMARA', 'SENADO'] })
  @IsOptional()
  @IsIn(['CAMARA', 'SENADO'])
  house?: string;

  @ApiPropertyOptional({ enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'] })
  @IsOptional()
  @IsIn(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'])
  performanceLevel?: string;

  @ApiPropertyOptional({ description: 'Score mínimo (0–100)' })
  @IsOptional()
  @IsNumberString()
  minScore?: string;

  @ApiPropertyOptional({ description: 'Score máximo (0–100)' })
  @IsOptional()
  @IsNumberString()
  maxScore?: string;

  @ApiPropertyOptional({ description: 'Filtrar apenas membros da FPE (true/false)' })
  @IsOptional()
  @IsString()
  fpeFilter?: string;

  @ApiPropertyOptional({ default: '50' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ default: '0' })
  @IsOptional()
  @IsNumberString()
  offset?: string;

  @ApiPropertyOptional({ enum: ['name', 'score'], default: 'name' })
  @IsOptional()
  @IsIn(['name', 'score'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
