import { useLocation } from 'react-router-dom';
import { Box, Center, Text, Stack } from '@chakra-ui/react';
import { Download, ExternalLink } from 'lucide-react';

// A API vive em domínio próprio (VPS/Railway) — links relativos cairiam
// no domínio do Vercel, onde não existe /api/*. Achado real 2026-08-23.
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const DadosAbertos: React.FC = () => {
  const location = useLocation();
  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <Box py={16} px={4} maxW="720px" mx="auto">
      <Center mb={12}>
        <Text fontSize="2xl" fontWeight="bold" color="primary">
          Dados Abertos — A Bancada Evangélica
        </Text>
      </Center>

      <Stack spacing={6} maxW="600px" mx="auto">
        <Text>
          Este projeto disponibiliza os dados de transparência e pontuação dos
          parlamentares brasileiros com base em critérios objetivos da metodologia.
          Os dados podem ser utilizados para pesquisas, jornalismo ou análise pessoal.
        </Text>

        <Stack spacing={3}>
          <a
            href={`${API_BASE_URL}/api/politicians/export/csv`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
            download
          >
            <Download className="h-5 w-5" />
            Baixar ranking completo em CSV
          </a>

          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Explorar a API no Swagger (/api/docs)
          </a>
        </Stack>

        <Stack spacing={3} mt={6} pt={4} borderTopWidth={1} fontSize="sm">
          <Text color="muted">Como citar esses dados:</Text>
          <Text>
            A Bancada Evangélica{location.pathname}. Acesso em {today}. Dados
            provenientes de votações nominais públicas da Câmara dos Deputados e do
            Senado Federal. Para detalhes de cálculo, consulte a{' '}
            <a href="/metodologia" className="underline">Metodologia</a>.
          </Text>
          <Text color="muted">
            LGPD: os dados são de domínio público (votos nominais e ementas). Não há
            tratamento de dados pessoais sensíveis além do registro público de votação
            parlamentar.
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};
