import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePoliticianSearch } from '@/hooks/usePoliticianSearch';

interface PoliticianSelectorProps {
  excludeIds: number[];
  onSelect: (politicianId: number) => void;
  onClose: () => void;
}

export function PoliticianSelector({ excludeIds, onSelect, onClose }: PoliticianSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading } = usePoliticianSearch(searchQuery, 50);

  const filteredPoliticians = searchResults?.politicians.filter(
    politician => !excludeIds.includes(politician.id)
  ) || [];

  const getPerformanceBadge = (level: string) => {
    const variants = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      AVERAGE: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-red-100 text-red-800'
    };
    return variants[level as keyof typeof variants] || variants.AVERAGE;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Selecionar Político</h2>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="Fechar seleção de político">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, partido ou estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Buscando políticos...</p>
            </div>
          ) : filteredPoliticians.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>Nenhum político encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPoliticians.map((politician) => (
                <div
                  key={politician.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelect(politician.id)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={politician.photoUrl} alt={politician.name} />
                      <AvatarFallback>
                        {politician.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{politician.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{politician.currentParty}</span>
                        <span>•</span>
                        <span>{politician.currentState}</span>
                        <span>•</span>
                        <span>
                          {politician.currentHouse === 'CAMARA' ? 'Deputado(a)' : 'Senador(a)'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-blue-600">
                        {politician.scores.overall.toFixed(1)}
                      </div>
                      <Badge className={`text-xs ${getPerformanceBadge(politician.scores.performanceLevel)}`}>
                        {politician.scores.performanceLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Clique em um político para adicioná-lo à comparação
          </p>
        </div>
      </div>
    </div>
  );
}