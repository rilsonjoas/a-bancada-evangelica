import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ description: 'Nome de quem envia' })
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'E-mail de quem envia (usado como reply-to)' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(320)
  email!: string;

  @ApiProperty({ description: 'Assunto da mensagem' })
  @IsString()
  @MinLength(1, { message: 'Assunto é obrigatório' })
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ description: 'Corpo da mensagem' })
  @IsString()
  @MinLength(1, { message: 'Mensagem é obrigatória' })
  @MaxLength(5000)
  message!: string;
}
