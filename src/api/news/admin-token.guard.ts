import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'node:crypto';

/**
 * Guard de curadoria (#7). Não existe sistema de usuários no produto (API
 * pública de leitura); a área de curadoria é protegida por um token estático
 * de administrador configurado no deploy (env ADMIN_TOKEN).
 *
 * Fail-closed por design: sem ADMIN_TOKEN no ambiente, a área admin responde
 * 503 (não existe "aberto por padrão" para escrita). Comparação timing-safe.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Em produção o env admin do container nem existe por padrão — curadoria
    // fica desligada até alguém configurar ADMIN_TOKEN. Isso é intencional.
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      throw new ServiceUnavailableException('Curadoria desabilitada: ADMIN_TOKEN não configurado');
    }

    const provided = request.header('x-admin-token');
    if (!provided) {
      throw new ForbiddenException('Token de administrador ausente (x-admin-token)');
    }

    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      throw new ForbiddenException('Token de administrador inválido');
    }
    return true;
  }
}