// Serviço base para todas as APIs governamentais
import { APIConfig, SincronizacaoLog } from '@/types/api';

export class BaseAPIService {
  protected baseUrl: string;
  protected rateLimit: number;
  protected timeout: number;
  protected retryAttempts: number;
  protected lastRequestTime: number = 0;

  constructor(config: APIConfig['camara'] | APIConfig['senado']) {
    this.baseUrl = config.base_url;
    this.rateLimit = config.rate_limit;
    this.timeout = config.timeout;
    this.retryAttempts = config.retry_attempts;
  }

  /**
   * Rate limiting - garante que não ultrapassemos o limite de requests
   */
  protected async waitForRateLimit(): Promise<void> {
    const minInterval = (60 * 1000) / this.rateLimit; // ms entre requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Request com retry automático e rate limiting
   */
  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    await this.waitForRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ABancadaEvangelica/1.0',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit exceeded, wait and retry
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        console.error(`Attempt ${attempt}/${this.retryAttempts} failed:`, error);
        
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Request com paginação automática
   */
  protected async requestWithPagination<T>(
    endpoint: string,
    options: RequestInit = {},
    itemsPerPage: number = 100
  ): Promise<T[]> {
    const allItems: T[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const paginatedEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}itens=${itemsPerPage}&pagina=${page}`;
      
      try {
        const response = await this.request<{ dados: T[], links: unknown[] }>(paginatedEndpoint, options);
        
        if (response.dados && response.dados.length > 0) {
          allItems.push(...response.dados);
          
          // Verifica se há próxima página pelos links
          const nextLink = response.links?.find(link => link.rel === 'next');
          hasMorePages = !!nextLink;
          page++;
        } else {
          hasMorePages = false;
        }
        
        // Log de progresso
        console.log(`Página ${page - 1} processada. Total de itens: ${allItems.length}`);
        
      } catch (error) {
        console.error(`Erro na página ${page}:`, error);
        hasMorePages = false;
      }
    }

    return allItems;
  }

  /**
   * Logging de sincronização
   */
  protected async logSincronizacao(log: Omit<SincronizacaoLog, 'id'>): Promise<void> {
    try {
      // Aqui você salvaria no banco de dados
      console.log('Log de sincronização:', {
        id: Date.now().toString(),
        ...log,
      });
    } catch (error) {
      console.error('Erro ao salvar log de sincronização:', error);
    }
  }

  /**
   * Função utilitária para extrair ID de URI
   */
  protected extractIdFromUri(uri: string): number {
    const matches = uri.match(/\/(\d+)$/);
    return matches ? parseInt(matches[1]) : 0;
  }

  /**
   * Função utilitária para formatar datas
   */
  protected formatDate(dateString: string): string {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  /**
   * Função utilitária para limpar e validar CPF
   */
  protected cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Função utilitária para validar se string é uma data válida
   */
  protected isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Função para fazer cache simples de dados
   */
  protected cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  protected getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  protected setCached<T>(key: string, data: T, ttlMinutes: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }
}