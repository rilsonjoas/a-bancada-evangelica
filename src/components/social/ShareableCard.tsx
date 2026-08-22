import React, { useRef } from 'react';
import { Download, Share2 } from 'lucide-react';
import { CRITERIA } from '@/lib/criteria';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/apiClient';
import type { PoliticianDetail } from '@/hooks/usePoliticianDetail';

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
  // (<60, factual e respeitoso, sem vermelho de exposição). Direção
  // registrada no ROADMAP: foto em destaque, nota como herói visual,
  // selo da marca e deep link pro perfil real no rodapé.
  const overall = politician.currentScore?.overall ?? 0;
  const isProud = overall >= 60;

  const getPerformanceBadge = (level: string) => {
    const variants = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      AVERAGE: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-red-100 text-red-800'
    };
    return variants[level as keyof typeof variants] || variants.AVERAGE;
  };

  const downloadAsImage = async () => {
    if (!cardRef.current) return;

    try {
      // Importar dinamicamente html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Maior qualidade
        useCORS: true,
        allowTaint: true
      });

      // Criar link de download
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
        allowTaint: true
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${politician.name}_perfil.png`, {
            type: 'image/png'
          });

          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `Perfil de ${politician.name} - A Bancada Evangélica`,
                text: `Confira a avaliação de ${politician.name} na A Bancada Evangélica`,
                files: [file]
              });
              toast.success('Card compartilhado!');
            } catch (error) {
              // User cancelled
            }
          }
        } else {
          // Fallback: copy image to clipboard
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
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
    <div className="flex gap-2">
      <Button onClick={downloadAsImage} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Baixar Card
      </Button>
      <Button onClick={shareCard} variant="outline" size="sm">
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar Card
      </Button>
    </div>
  );

  // Rodapé com deep link real pro perfil — domínio separado do caminho
  // pra manter o contrato textual dos testes (getByText exato).
  const deepLinkFooter = (
    <div className="text-center pt-4 mt-auto">
      <p className="text-xs text-gray-600">
        Votos nominais registrados · {CRITERIA.length} critérios ponderados
      </p>
      <p className="text-sm font-semibold text-blue-700 mt-1">
        <span>a-bancada-evangelica.vercel.app</span>
        <span className="text-blue-500">/politicos/{politician.id}</span>
      </p>
    </div>
  );

  // Selo da marca (logo branco sobre a faixa)
  const brandSeal = (
    <div className="flex items-center justify-center gap-2 mb-3">
      <img src="/marca-white.png" alt="" aria-hidden="true" className="h-7 w-7" />
      <div className="text-left">
        <p className="text-[13px] font-bold leading-none">A Bancada Evangélica</p>
        <p className="text-[10px] opacity-75 leading-tight mt-0.5">
          Transparência parlamentar por votos nominais
        </p>
      </div>
    </div>
  );

  if (type === 'summary') {
    const levelLabel = politician.currentScore?.performanceLevel || 'AVERAGE';

    return (
      <div className="space-y-4">
        {shareButtons}

        <div ref={cardRef} className="w-96 mx-auto rounded-xl overflow-hidden shadow-lg bg-white">
          {/* Faixa superior: gradiente cívico (orgulho) ou azul sóbrio (neutro) */}
          <div
            className="px-6 pb-16 pt-5 text-center"
            style={{
              backgroundImage: isProud
                ? 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            }}
          >
            {brandSeal}
            <Badge
              className={
                isProud ? 'bg-amber-300 text-amber-900 hover:bg-amber-300' : 'bg-slate-100 text-slate-800 hover:bg-slate-100'
              }
            >
              {politician.currentScore?.performanceLabel || 'Sem dados'}
            </Badge>
          </div>

          {/* Foto em destaque — pousando na borda da faixa */}
          <div className="-mt-12 flex flex-col items-center px-6">
            <img
              src={proxiedPhotoUrl}
              alt={politician.name}
              className={`h-28 w-28 rounded-full object-cover shadow-md bg-white ${
                isProud ? 'border-4 border-double border-[#b49a60]' : 'border-4 border-slate-300'
              }`}
            />

            <h2 className="text-xl font-extrabold text-gray-900 mt-3">{politician.name}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {politician.currentParty} - {politician.currentState}
            </p>

            {/* Nota: herói visual — verde quando orgulho, azul-marinho quando neutro */}
            <div className="mt-4 mb-1 text-center">
              <span
                className={`text-6xl font-black tracking-tight ${isProud ? 'text-emerald-600' : 'text-[#1e3a5f]'}`}
              >
                {(overall ?? 0).toFixed(1)}
              </span>
              <span className="text-lg font-medium text-gray-400">/100</span>
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-5">Pontuação geral</p>

            {/* Critérios como barras visuais — mais legível que lista chave=valor */}
            <div className="w-full space-y-2.5">
              {CRITERIA.map((c) => {
                const value =
                  (politician.currentScore?.[c.field as keyof typeof politician.currentScore] as number | undefined) ?? 0;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <c.Icon className={`h-3.5 w-3.5 ${c.iconClass}`} />
                        {c.label}
                      </span>
                      <span className="font-bold text-gray-900">{value.toFixed(0)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${isProud ? 'bg-indigo-600' : 'bg-slate-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Frase-quadro pelo humor do card */}
            <p className="mt-5 text-xs italic text-gray-600">
              {isProud
                ? 'Compromisso público com a transparência, verificado em votações nominais.'
                : 'Perfil público construído a partir de votos nominais registrados.'}
            </p>

            {deepLinkFooter}
          </div>
        </div>
      </div>
    );
  }

  // Detailed card version — selo da marca aplicado, estrutura mantida
  const levelLabelDetailed = politician.currentScore?.performanceLabel || 'AVERAGE';

  return (
    <div className="space-y-4">
      {shareButtons}

      <div ref={cardRef} className="w-[500px] mx-auto bg-white border rounded-xl shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div
          className="text-white p-6"
          style={{
            backgroundImage: isProud
              ? 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          }}
        >
          <div className="flex items-center gap-4">
            <img
              src="/marca-white.png"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{politician.name}</h2>
              <p className="opacity-80">{politician.currentParty} - {politician.currentState}</p>
            </div>
            <Badge className={isProud ? 'bg-amber-300 text-amber-900 hover:bg-amber-300' : 'bg-slate-100 text-slate-800 hover:bg-slate-100'}>
              {politician.currentScore?.performanceLabel || 'Sem dados'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`text-5xl font-black ${isProud ? 'text-emerald-600' : 'text-[#1e3a5f]'}`}>
              {(overall ?? 0).toFixed(1)}
            </div>
            <p className="text-gray-600 mt-1">Pontuação Geral</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {CRITERIA.slice(0, 4).map((c) => (
              <div key={c.key} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-lg font-bold ${c.iconClass.replace('text-', 'text-').replace('-500', '-600')}`}>
                  {(politician.currentScore?.[c.field as keyof typeof politician.currentScore] as number | undefined)?.toFixed(0) || '0'}
                </div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-0.5">
                  <c.Icon className={`h-3 w-3 ${c.iconClass}`} />
                  {c.label.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center border-t pt-4">
            <p className="text-xs text-gray-600">
              Avaliação baseada em valores cristãos · votos nominais
            </p>
            {deepLinkFooter}
          </div>
        </div>
      </div>
    </div>
  );
}
