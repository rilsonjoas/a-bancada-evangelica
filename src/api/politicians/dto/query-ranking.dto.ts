import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryRankingDto {
  @ApiPropertyOptional({ enum: ['CAMARA', 'SENADO'] })
  @IsOptional()
  @IsIn(['CAMARA', 'SENADO'])
  house?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  party?: string;

  @ApiPropertyOptional({ default: '50' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    enum: ['overall', 'lifeProtection', 'familyValues', 'moralIntegrity', 'socialResponsibility', 'religiousFreedom'],
    default: 'overall',
  })
  @IsOptional()
  @IsIn(['overall', 'lifeProtection', 'familyValues', 'moralIntegrity', 'socialResponsibility', 'religiousFreedom'])
  criteria?: string;
}
