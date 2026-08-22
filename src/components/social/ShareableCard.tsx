import React, { useRef } from 'react';
import { Download, Share2, BarChart2 } from 'lucide-react';
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  if (type === 'summary') {
    return (
      <div className="space-y-4">
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

        <div 
          ref={cardRef}
          className="w-96 mx-auto rounded-xl border-2 border-[#1e3a5f]/15 bg-white p-6 shadow-lg"
          style={{ backgroundImage: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-gray-800 mb-1">A Bancada Evangélica</h1>
            <p className="text-xs text-gray-600">Transparência Parlamentar</p>
          </div>

          {/* Politician Info — retrato em tondo com anel, foto via proxy */}
          <div className="text-center mb-6">
            <img
              src={proxiedPhotoUrl}
              alt={politician.name}
              className="h-24 w-24 mx-auto mb-4 rounded-full object-cover border-4 border-double border-[#b49a60] bg-white p-0.5 shadow"
            />
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">{politician.name}</h2>
            <p className="text-sm text-gray-600 mb-3">
              {politician.currentParty} - {politician.currentState}
            </p>
            
            <Badge className={`${getPerformanceBadge(politician.currentScore?.performanceLevel || 'AVERAGE')}`}>
              {politician.currentScore?.performanceLabel || 'Sem dados'}
            </Badge>
          </div>

          {/* Score — o número é o herói do card */}
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold mb-1 ${getScoreColor(politician.currentScore?.overall || 0)}`}>
              {(politician.currentScore?.overall ?? 0).toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">de 100 · Pontuação Geral</p>
          </div>

          {/* Criteria Scores */}
          <div className="space-y-2 mb-6">
            {CRITERIA.map(c => (
              <div key={c.key} className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <c.Icon className={`h-3.5 w-3.5 ${c.iconClass}`} />
                  {c.label}
                </span>
                <span className="font-semibold">
                  {(politician.currentScore?.[c.field as keyof typeof politician.currentScore] as number | undefined)?.toFixed(0) || '0'}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center border-t pt-4">
            <p className="text-xs text-gray-600">
              Votos nominais registrados · {CRITERIA.length} critérios ponderados
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              a-bancada-evangelica.vercel.app
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Detailed card version
  return (
    <div className="space-y-4">
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

      <div 
        ref={cardRef}
        className="w-[500px] mx-auto bg-white border rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center gap-4">
            <img
              src={proxiedPhotoUrl}
              alt={politician.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-white bg-white"
            />
            <div>
              <h2 className="text-xl font-bold">{politician.name}</h2>
              <p className="text-blue-100">{politician.currentParty} - {politician.currentState}</p>
              <Badge className="bg-white text-blue-600 mt-2">
                {politician.currentScore?.performanceLabel || 'Sem dados'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(politician.currentScore?.overall || 0)}`}>
              {politician.currentScore?.overall?.toFixed(1) || '0.0'}
            </div>
            <p className="text-gray-600">Pontuação Geral</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {CRITERIA.slice(0, 4).map(c => (
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
            <p className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" /> Avaliação baseada em valores cristãos
            </p>
            <p className="text-sm font-semibold text-blue-600">
              A Bancada Evangélica
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}