import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';

// Achado real 2026-08-16: o formulário de contato do site era decorativo
// (front chamava um handler que só simulava sucesso, nada era enviado).
// Este serviço manda o e-mail de verdade via API do Resend (domínio
// narniano.com verificado no mesmo dia). fetch nativo — sem SDK novo.
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async send(dto: CreateContactDto): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY não configurada — e-mail não enviado');
      throw new ServiceUnavailableException(
        'Envio de e-mail está indisponível no momento. Tente de novo mais tarde.',
      );
    }

    const to = process.env.CONTACT_EMAIL_TO ?? 'abancada@narniano.com';
    const from = process.env.CONTACT_EMAIL_FROM ?? 'abancada@narniano.com';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `A Bancada Evangélica <${from}>`,
        to: [to],
        reply_to: dto.email,
        subject: `[Contato do site] ${dto.subject}`,
        text: `Nome: ${dto.name}\nE-mail: ${dto.email}\n\n${dto.message}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend respondeu ${res.status}: ${body}`);
      throw new BadGatewayException('Não foi possível enviar sua mensagem agora. Tente de novo mais tarde.');
    }
  }
}
