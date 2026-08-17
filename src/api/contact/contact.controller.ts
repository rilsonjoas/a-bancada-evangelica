import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('contact')
@Controller('api/contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  // Mais restrito que o padrão global (100/min) — formulário público,
  // sem auth/captcha, cada envio dispara e-mail de verdade.
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Envia mensagem do formulário de contato' })
  async create(@Body() dto: CreateContactDto) {
    await this.contact.send(dto);
    return { message: 'Mensagem enviada com sucesso.' };
  }
}
