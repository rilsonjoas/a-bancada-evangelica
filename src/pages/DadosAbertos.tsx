import { Link, useLocation } from 'react-router-dom';
import { Box, Center, Text, Button, Stack, Link as ChakraLink } from '@chakra-ui/react';
import { ExternalLink, Download } from 'lucide-react';

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
          parlamentares brasileiros com base em critérios objetivos da metodologia
          da FPE (Frente Parlamentar Evangélica). Os dados podem ser utilizados
          para pesquisas, jornalismo ou análise pessoal.
        </Text>

        <Stack spacing={4}>
          <Button
            asChild
            variant="outline"
            size="lg"
            _hover={{ bg: "primary", color: "white" }}
          >
            <Download className="mr-3 h-5 w-5" /> Download CSV do Ranking
            <ChakraLink
              to="/api/politicians/export/csv"
              className="underline text-primary font-medium"
            >
              link direto
            </ChakraLink>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            mt={4}
            _hover={{ bg: "primary", color: "white" }}
          >
            <ExternalLink className="mr-3 h-5 w-5" /> Ver API no Swagger
            <ChakraLink
              to="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary font-medium"
            >
              /api/docs
            </ChakraLink>
          </Button>
        </Stack>

        <Stack spacing={3} mt={6} pt={4} borderTop border-border text-sm>
          <Text color="muted">Como citar esses dados:</Text>
          <Text marginTop={1}>
            A Bancada Evangélica{""} {location.pathname}. Acesso em {today}.
            Dados disponíveis sob licença de dados abertos da Câmara dos Deputados
            e Senado Federal. Para mais informações, consulte a
            <ChakraLink to="/metodologia">Metodologia</ChakraLink>.
          </Text>

          <Text marginTop={2} color="muted">
            ⚠️ Os dados são provenientes de votações nominais públicas e ementas de
            proposições, info de domínio público. Não há tratamento de dados
            pessoais sensíveis.
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};
