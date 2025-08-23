# A Bancada Evangélica

## 📋 Sobre o Projeto

**A Bancada Evangélica** é uma plataforma de transparência parlamentar que avalia e classifica políticos brasileiros com base no alinhamento com valores cristãos e evangélicos, promovendo maior accountability e discernimento político.

### 🎯 Missão e Visão
- **Propósito**: Informar e fornecer ferramentas para avaliação da atuação parlamentar à luz de princípios de fé
- **Público**: Eleitores conscientes, líderes religiosos, comunidades de fé, mídia, pesquisadores  
- **Impacto**: Promover maior accountability e discernimento político baseado em critérios objetivos

## 🚀 Estado Atual do Projeto

### ✅ Implementado (Protótipo Frontend - Vite/React)
- **Interface Base**: Sistema de navegação completo com Header/Footer responsivos
- **Página de Ranking**: Listagem de políticos com filtros por estado, partido e casa legislativa
- **Cards de Políticos**: Exibição de informações básicas e pontuação geral
- **Sistema de Pontuação Visual**: Badges coloridos por faixa de desempenho (Excelente ≥80, Bom ≥60, Médio ≥40, Insuficiente <40)
- **Filtros e Busca**: Sistema funcional de filtros com estatísticas em tempo real
- **Dados Mock**: Estrutura completa de dados simulados para demonstração
- **Design System**: Componentes Shadcn/ui com tema customizado e paleta profissional

### 🏗️ Arquitetura Técnica Atual
- **Frontend**: Vite + React 18 + TypeScript
- **UI Framework**: Tailwind CSS + Shadcn/ui
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM
- **Gerenciamento de Estado**: TanStack Query (preparado para APIs)
- **Tipagem**: TypeScript com interfaces completas

### 📊 Sistema de Avaliação Definido
Os políticos são avaliados em **5 categorias** com pesos específicos:
1. **Proteção à Vida** (30%) - Aborto, eutanásia, pena de morte
2. **Defesa da Família** (25%) - Casamento, adoção, educação dos filhos
3. **Integridade Moral** (20%) - Corrupção, transparência, ética
4. **Responsabilidade Social** (15%) - Justiça social, cuidado com vulneráveis
5. **Liberdade Religiosa** (10%) - Expressão religiosa, ensino religioso

## 🗺️ Roadmap de Desenvolvimento

### 📍 **Fase 0: Fundamentação e Design** (Em Andamento)
- [x] Definição de missão e visão claras
- [x] Sistema de pontuação e critérios iniciais
- [x] Design visual profissional implementado
- [ ] **Pesquisa aprofundada dos critérios de "Testemunho Fiel"**
- [ ] **Documentação completa da metodologia**
- [ ] **Definição da stack tecnológica final**

### 📍 **Fase 1: Dados e Backend** (Planejado)
- [ ] Modelagem completa do banco de dados PostgreSQL
- [ ] Scripts de coleta via APIs (Câmara, Senado, TSE)
- [ ] Sistema de limpeza e tratamento de dados
- [ ] Processo de sincronização automática
- [ ] Lógica de cálculo de pontuação implementada

### 📍 **Fase 2: API Backend** (Planejado)
- [ ] **Stack**: Node.js + NestJS + PostgreSQL
- [ ] Endpoints RESTful completos:
  - `GET /politicians` - Listagem com filtros e paginação
  - `GET /politicians/{id}` - Perfil detalhado
  - `GET /politicians/{id}/votes` - Histórico de votações
  - `GET /politicians/{id}/bills` - Projetos de autoria
  - `GET /politicians/{id}/criteria-scores` - Pontuação detalhada
  - `GET /rankings` - Rankings ordenados
  - `GET /methodology-details` - Metodologia completa

### 📍 **Fase 3: Frontend Avançado** (Migração para Next.js)
- [ ] **Migração**: Vite/React → Next.js 14 (App Router)
- [ ] **Páginas Completas**:
  - `app/page.tsx` - HomePage com ranking
  - `app/politicians/[id]/page.tsx` - Perfil do político
  - `app/metodologia/page.tsx` - Metodologia detalhada
  - `app/sobre/page.tsx` - Sobre o projeto
  - `app/contato/page.tsx` - Contato
- [ ] **Componentes Avançados**:
  - Sistema de abas para perfil do político
  - Gráficos interativos (Chart.js/Recharts)
  - Comparação entre políticos
  - Filtros avançados

### 📍 **Fase 4: Funcionalidades Especiais**
- [ ] **Geração de "Ficha Compartilhável"**:
  - Endpoint para geração de imagem da ficha
  - Sistema de compartilhamento social
  - Meta tags OpenGraph otimizadas
- [ ] **Recursos Interativos**:
  - Botões de compartilhamento social
  - Gráficos de desempenho por critério
  - Comparação entre políticos
  - Sistema de alertas para novas votações

### 📍 **Fase 5: Monetização e Otimização**
- [ ] Integração Google AdSense
- [ ] Otimização de performance
- [ ] Testes automatizados
- [ ] SEO avançado
- [ ] Analytics e monitoramento

### 📍 **Fase 6: Lançamento e Manutenção**
- [ ] Deploy em produção
- [ ] Estratégia de divulgação
- [ ] Sistema de atualização contínua
- [ ] Coleta de feedback e melhorias

## 💻 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18+)
- npm ou yarn

### Instalação e Execução
```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd a-bancada-evangelica

# 2. Instale as dependências
npm install

# 3. Execute em desenvolvimento
npm run dev
# Acesse: http://localhost:8080

# 4. Build para produção
npm run build

# 5. Execute o linter
npm run lint
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Header, Footer
│   ├── politicians/     # PoliticianCard, componentes específicos
│   └── ui/             # Componentes Shadcn/ui
├── data/               # Mock data (temporário)
├── hooks/              # Custom hooks React
├── lib/                # Utilitários (cn, etc.)
├── pages/              # Páginas da aplicação
├── types/              # Definições TypeScript
└── assets/             # Imagens e recursos
```

## 🎨 Design System

### Paleta de Cores
- **Cores Principais**: Azul institucional com gradientes
- **Scores**: Verde (Excelente), Amarelo (Bom), Laranja (Médio), Vermelho (Insuficiente)
- **Neutros**: Tons de cinza para backgrounds e bordas

### Componentes Base
- **Cards**: Shadcn/ui Card para fichas de políticos
- **Badges**: Sistema de badges para status e pontuações
- **Tipografia**: Font Serif para títulos, Sans para corpo do texto
- **Layout**: Grid responsivo com breakpoints otimizados

## 🔧 Tecnologias

### Frontend Atual
- **Vite** - Build tool
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes
- **Lucide React** - Ícones
- **React Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado

### Stack Planejada
- **Frontend**: Next.js 14 + TypeScript + Tailwind + Shadcn/ui
- **Backend**: Node.js + NestJS + TypeScript
- **Banco de Dados**: PostgreSQL
- **APIs Externas**: Câmara dos Deputados, Senado Federal, TSE
- **Gráficos**: Chart.js ou Recharts
- **Deploy**: Vercel/Netlify (Frontend) + Railway/Heroku (Backend)

## 🤝 Contribuindo

Este projeto tem potencial para impacto cívico significativo. Contribuições são bem-vindas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Áreas que Precisam de Contribuição
- **Pesquisa**: Definição rigorosa de critérios de avaliação
- **Backend**: Desenvolvimento da API e sistema de dados
- **Frontend**: Migração para Next.js e componentes avançados
- **Design**: Refinamento da identidade visual
- **Conteúdo**: Textos para metodologia e páginas institucionais

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE) - veja o arquivo LICENSE para detalhes.

## 📞 Contato

Para dúvidas, sugestões ou parcerias:
- Abra uma [Issue](../../issues)
- Entre em contato através da página de contato do projeto

---

> **Nota**: Este projeto está em desenvolvimento ativo. A metodologia de avaliação será baseada em pesquisa rigorosa e critérios objetivos, com transparência total sobre os processos de pontuação.