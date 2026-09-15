import React, { useRef } from 'react';
import { Download, Share2 } from 'lucide-react';
import { CRITERIA } from '@/lib/criteria';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/apiClient';
import type { PoliticianDetail } from '@/hooks/usePoliticianDetail';
import { fmt } from '@/lib/format';

interface ShareableCardProps {
  // Reusa o tipo real do hook em vez de duplicar a forma do currentScore
  politician: Pick<
    PoliticianDetail,
    'id' | 'name' | 'currentParty' | 'currentState' | 'photoUrl' | 'currentScore'
  >;
  type?: 'summary' | 'detailed';
}

export function ShareableCard({ politician, type = 'summary' }: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Foto via proxy same-origin da API — a URL direta da Câmara é
  // cross-origin e o html2canvas a descarta (fotos brancas no PNG).
  const proxiedPhotoUrl = `${API_BASE_URL}/api/politicians/${politician.id}/photo`;

  // Card v2 (2026-08-22): dois humores por desempenho — "orgulho"
  // (>=60, pra o PRÓPRIO deputado querer compartilhar) e "neutro"
  // (<60, factual e respeitoso, sem vermelho de exposição).
  const overall = politician.currentScore?.overall ?? 0;
  const isProud = overall >= 60;

  const downloadAsImage = async () => {
    if (!cardRef.current) return;

    try {
      // Importar dinamicamente html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `${politician.name.replace(/\s+/g, '_')}_perfil.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success('Card baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar imagem do card');
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${politician.name}_perfil.png`, {
            type: 'image/png',
          });

          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `Perfil de ${politician.name} - A Bancada Evangélica`,
                text: `Confira a avaliação de ${politician.name} na A Bancada Evangélica`,
                files: [file],
              });
              toast.success('Card compartilhado!');
            } catch (error) {
              // User cancelled
            }
          }
        } else {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            toast.success('Imagem copiada para a área de transferência!');
          } catch (error) {
            toast.error('Erro ao compartilhar. Tente baixar a imagem.');
          }
        }
      }, 'image/png');
    } catch (error) {
      toast.error('Erro ao gerar card para compartilhamento');
    }
  };

  const shareButtons = (
    <div className="flex gap-3 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10 py-2 border-b border-border/50">
      <Button onClick={downloadAsImage} className="bg-primary text-primary-foreground font-bold text-xs flex-1">
        <Download className="w-4 h-4 mr-2" />
        Baixar Card
      </Button>
      <Button onClick={shareCard} variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 font-bold text-xs flex-1">
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar Card
      </Button>
    </div>
  );

  // Data da última apuração, formato curto (ex.: "ago 2026")
  const lastCalc =
    politician.currentScore?.lastCalculation
      ? new Date(politician.currentScore.lastCalculation)
          .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          .replace('.', '')
      : null;

  if (type === 'summary') {
    return (
      <div className="space-y-4">
        {shareButtons}

        {/* ── PÔSTER DE EXPORTAÇÃO (v2.1) ─────────────────────────────
            Layout dedicado pra imagem final: sem margens negativas, sem
            elementos sobrepostos, paddings explícitos em toda seção e
            rodapé sólido. O que vale é o PNG que sai, não a página. */}
        <div ref={cardRef} className="w-[420px] max-w-full mx-auto bg-white shadow-xl">
          {/* Fio dourado de topo */}
          <div className="h-1.5 bg-[#b49a60]" />

          {/* Cabeçalho institucional */}
          <div
            className="px-7 pt-6 pb-24 text-center"
            style={{
              backgroundImage: isProud
                ? 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            }}
          >
            {/* Selo da marca */}
            <div className="flex items-center justify-center gap-3">
              <img src="/marca-white.png" alt="" aria-hidden="true" className="h-10 w-10" />
              <div className="text-left">
                <p className="text-white text-base font-bold leading-tight">
                  A Bancada Evangélica
                </p>
                <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-widest leading-tight">
                  TRANSPARÊNCIA PARLAMENTAR
                </p>
              </div>
            </div>

            {/* Selo de desempenho */}
            <span
              className={`inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isProud ? 'bg-[#b49a60] text-[#1e293b]' : 'bg-slate-600 text-slate-100'
              }`}
            >
              {politician.currentScore?.performanceLabel || 'Sem dados'}
            </span>
          </div>

          {/* Corpo — foto cortando o cabeçalho com anel branco */}
          <div className="px-8 -mt-16">
            <div className="flex justify-center">
              <img
                src={proxiedPhotoUrl}
                alt={politician.name}
                className="h-32 w-32 rounded-full object-cover border-[6px] border-white shadow-md bg-white"
              />
            </div>

            <h2 className="text-center text-[26px] leading-tight font-extrabold text-gray-900 mt-4">
              {politician.name}
            </h2>
            <p className="text-center text-sm font-semibold text-slate-500 mt-1">
              {politician.currentParty} - {politician.currentState}
            </p>

            {/* Nota — herói absoluto, bloco próprio, zero colisão */}
            <div className="mt-7 text-center">
              <div className="flex items-start justify-center">
                <span
                  className={`text-[88px] leading-[0.85] font-black ${
                    isProud ? 'text-emerald-600' : 'text-[#1e3a5f]'
                  }`}
                >
                  {fmt(overall ?? 0)}
                </span>
                <span className="text-2xl font-bold text-slate-400 mt-2 ml-1">/100</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Nota geral
              </p>
            </div>

            {/* Critérios */}
            <div className="mt-8 space-y-4">
              {CRITERIA.map((c) => {
                const value =
                  (politician.currentScore?.[c.field as keyof typeof politician.currentScore] as number | undefined) ?? 0;
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-gray-700">
                        <c.Icon className={`h-4 w-4 ${c.iconClass}`} />
                        {c.label}
                      </span>
                      <span className="font-extrabold text-gray-900">{fmt(value, 0)}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-2.5 rounded-full ${isProud ? 'bg-indigo-600' : 'bg-slate-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Frase-quadro + frescor do dado */}
            <p className="mt-8 text-center text-[13px] italic leading-relaxed text-slate-600">
              {isProud
                ? 'Compromisso público com a transparência, verificado em votações nominais.'
                : 'Perfil público construído a partir de votos nominais registrados.'}
            </p>
            <p className="mt-4 text-center text-[12px] font-medium text-slate-500">
              Votos nominais registrados · {CRITERIA.length} critérios ponderados
            </p>
            {lastCalc && (
              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Dados atualizados em {lastCalc}
              </p>
            )}
            <div className="pb-8" />
          </div>

          {/* Rodapé sólido — barra de fechamento estilo pôster */}
          <div
            className="px-7 py-4 flex items-center justify-between"
            style={{ backgroundColor: isProud ? '#1e3a8a' : '#0f172a' }}
          >
            <div className="flex items-center gap-2">
              <img src="/marca-white.png" alt="" aria-hidden="true" className="h-6 w-6" />
              <span className="text-white text-[11px] font-bold">A Bancada Evangélica</span>
            </div>
            <div className="text-right leading-tight">
              <p className="text-[10px] text-white font-semibold">
                a-bancada-evangelica.vercel.app
              </p>
              <p className="text-[10px] text-[#b49a60] font-medium">
                /politicos/{politician.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Variante detailed: mesmo pôster, com os 5 critérios em destaque
  // maior e frase de valores. Mantém selo e humores do summary.
  return (
    <div className="space-y-4">
      {shareButtons}

      <div ref={cardRef} className="w-[480px] max-w-full mx-auto bg-white shadow-xl">
        <div className="h-1.5 bg-[#b49a60]" />

        <div
          className="px-7 pt-6 pb-20 text-center"
          style={{
            backgroundImage: isProud
              ? 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <img src="/marca-white.png" alt="" aria-hidden="true" className="h-10 w-10" />
            <div className="text-left">
              <p className="text-white text-base font-bold leading-tight">A Bancada Evangélica</p>
              <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-widest leading-tight">
                TRANSPARÊNCIA PARLAMENTAR
              </p>
            </div>
          </div>
          <span
            className={`inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isProud ? 'bg-[#b49a60] text-[#1e293b]' : 'bg-slate-600 text-slate-100'
            }`}
          >
            {politician.currentScore?.performanceLabel || 'Sem dados'}
          </span>
        </div>

        <div className="px-8 -mt-16">
          <div className="flex justify-center">
            <img
              src={proxiedPhotoUrl}
              alt={politician.name}
              className="h-36 w-36 rounded-full object-cover border-[6px] border-white shadow-md bg-white"
            />
          </div>

          <h2 className="text-center text-[28px] leading-tight font-extrabold text-gray-900 mt-4">
            {politician.name}
          </h2>
          <p className="text-center text-sm font-semibold text-slate-500 mt-1">
            {politician.currentParty} - {politician.currentState}
          </p>

          <div className="mt-7 text-center">
            <div className="flex items-start justify-center">
              <span
                className={`text-[92px] leading-[0.85] font-black ${
                  isProud ? 'text-emerald-600' : 'text-[#1e3a5f]'
                }`}
              >
                {fmt(overall ?? 0)}
              </span>
              <span className="text-2xl font-bold text-slate-400 mt-2 ml-1">/100</span>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Nota geral
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {CRITERIA.slice(0, 4).map((c) => {
              const value =
                (politician.currentScore?.[c.field as keyof typeof politician.currentScore] as number | undefined) ?? 0;
              return (
                <div key={c.key} className="rounded-xl bg-slate-50 p-4 text-center">
                  <c.Icon className={`mx-auto h-5 w-5 ${c.iconClass}`} />
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">{fmt(value, 0)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {c.label}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-7 text-center text-[13px] italic leading-relaxed text-slate-600">
            Avaliação baseada em valores cristãos, apurada por votos nominais públicos.
          </p>
          <p className="mt-4 text-center text-[12px] font-medium text-slate-500">
            Votos nominais registrados · {CRITERIA.length} critérios ponderados
          </p>
          {lastCalc && (
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Dados atualizados em {lastCalc}
            </p>
          )}
          <div className="pb-8" />
        </div>

        <div
          className="px-7 py-4 flex items-center justify-between"
          style={{ backgroundColor: isProud ? '#1e3a8a' : '#0f172a' }}
        >
          <div className="flex items-center gap-2">
            <img src="/marca-white.png" alt="" aria-hidden="true" className="h-6 w-6" />
            <span className="text-white text-[11px] font-bold">A Bancada Evangélica</span>
          </div>
          <div className="text-right leading-tight">
            <p className="text-[10px] text-white font-semibold">a-bancada-evangelica.vercel.app</p>
            <p className="text-[10px] text-[#b49a60] font-medium">/politicos/{politician.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
