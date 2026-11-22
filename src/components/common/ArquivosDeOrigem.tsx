import { ExternalLink } from 'lucide-react';
import { CAPTURAS, type Captura } from '@/lib/capturas';

const mb = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.round(b / 1000).toLocaleString('pt-BR')} KB`);
const dataBR = (iso: string) => iso.split('-').reverse().join('/');

/**
 * "Arquivos de origem e seus hashes" (E1 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Mostra cada arquivo do TSE que o projeto baixou, com data, tamanho e SHA-256,
 * para qualquer pessoa conferir se o arquivo que tem é o mesmo. Diz também o
 * limite: o TSE republica arquivos, então hash diferente não prova adulteração.
 */
export function ArquivosDeOrigem({ capturas = CAPTURAS }: { capturas?: ReadonlyArray<Captura> }) {
  if (capturas.length === 0) return null;

  return (
    <details className="pt-4 border-t border-border text-sm">
      <summary className="cursor-pointer py-1 font-semibold text-base text-foreground">
        Arquivos de origem e seus hashes (SHA-256)
      </summary>
      <div className="mt-2 space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          Estes são os arquivos do TSE que o projeto baixou, com a data em que foram capturados e o código SHA-256
          (uma impressão digital do conteúdo). Para conferir, baixe o arquivo no TSE e rode{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">sha256sum nome-do-arquivo.zip</code>. O TSE republica
          arquivos de tempos em tempos: um hash diferente do seu geralmente quer dizer que o TSE atualizou o arquivo
          depois da nossa captura, e não que algo foi alterado. Esta lista registra o que foi baixado, não necessariamente o que já alimenta o site; os marcados como levantamento ainda não foram importados.
        </p>
        <ul className="space-y-3">
          {capturas.map((c) => (
            <li key={c.sha256} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">
                {c.tipo} ({c.ano})
              </p>
              <p className="mt-0.5">
                {c.urlOficial && c.urlOficial.startsWith('https://') ? (
                  <a
                    href={c.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all py-1 text-xs underline hover:text-primary"
                  >
                    {c.arquivo}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                ) : (
                  <span className="break-all text-xs text-muted-foreground">
                    {c.arquivo} (endereço de download não registrado)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Capturado em {dataBR(c.capturadoEm)} · {mb(c.bytes)}
              </p>
              {c.observacao && <p className="text-xs text-muted-foreground">{c.observacao}</p>}
              <p className="mt-1 text-xs text-muted-foreground">SHA-256</p>
              <p className="font-mono text-xs break-all select-all">{c.sha256}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
