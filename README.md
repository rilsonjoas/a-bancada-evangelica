# A Bancada Evangélica

<p align="center">
  <strong>Plataforma de transparência parlamentar que promove accountability político baseado em valores cristãos</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.19-purple?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-5.1.0-green?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-5.20.0-teal?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Ready-blue?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Ready-green?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

## 📋 Sobre o Projeto

**A Bancada Evangélica** é uma plataforma de transparência parlamentar que avalia e classifica políticos brasileiros com base no alinhamento com valores cristãos e evangélicos, promovendo maior accountability e discernimento político.

### 🎯 Missão e Visão
- **Propósito**: Equipar o eleitor cristão com dados objetivos e análises criteriosas para decisões conscientes
- **Filosofia**: Ferramenta de **discernimento**, não lista de "políticos aprovados"
- **Público**: Eleitores conscientes, líderes religiosos, comunidades de fé, mídia e pesquisadores
- **Impacto**: Promover maior accountability e discernimento político baseado em critérios objetivos e transparentes

### ✨ Funcionalidades Principais
- **Ranking de Políticos**: Classificação baseada em 7 critérios fundamentais com pesos específicos
- **Sistema de Filtros**: Busca por estado, partido, casa legislativa e faixa de pontuação
- **Página de Metodologia**: Documentação completa dos critérios de avaliação
- **Interface Responsiva**: Design otimizado para desktop, tablet e mobile
- **Dados em Tempo Real**: Estatísticas atualizadas e métricas de desempenho
- **API Completa**: Backend robusto com dados reais dos parlamentares

## 🚀 Estado Atual do Projeto

### ✅ **CONCLUÍDO - Sistema Completo Fases 1, 2, 3, 4 (Parcial) e Integração com APIs**

#### **🆕 ATUALIZAÇÕES RECENTES (Outubro 2025)**

**Correções Técnicas Implementadas:**
- ✅ **CORS Configurado** (src/api/server.ts:10-15): Configuração explícita permitindo requisições de localhost:8080 e 127.0.0.1:8080
- ✅ **Parser XML Senado** (scripts/sync-senado.ts:3): Instalado e configurado `xml2js` para fazer parse da API XML do Senado Federal
- ✅ **Fallback de Imagens** (src/components/politicians/PoliticianCard.tsx:16,65-74): Hook useState para gerenciar erros de imagem com fallback automático para ícone User
- ✅ **Seed Atualizado** (prisma/seed.ts:194,205,216,233,244): Removidas URLs inválidas (example.com), definido photo_url como null para sincronização automática

**Dados Sincronizados:**
- ✅ **Senado Federal**: 81/81 senadores (100% concluído)
- 🔄 **Câmara dos Deputados**: 694 deputados (85%+ em progresso)
- ✅ **Fotos Oficiais**: URLs reais das APIs oficiais da Câmara e Senado
- ✅ **Banco Atualizado**: Dados da 57ª Legislatura (2023-2027)

#### **🎨 Frontend (React + TypeScript)**
- **Interface Base**: Sistema de navegação completo com Header/Footer responsivos
- **Página de Ranking**: Listagem de políticos com filtros dinâmicos por estado, partido e casa legislativa
- **Cards de Políticos**: Exibição completa com dados reais do banco de dados
- **Sistema de Pontuação Visual**: Badges coloridos por nível de performance (Excelente, Bom, Médio, Insuficiente)
- **Filtros e Busca**: Sistema funcional com estatísticas atualizadas em tempo real
- **Páginas Individuais**: Perfis completos de políticos com tabs e gráficos
- **Sistema de Comparação**: Comparação side-by-side de múltiplos políticos
- **Dashboard de Votações**: Análise detalhada de votações e tendências
- **Compartilhamento Social**: Sistema completo de compartilhamento em redes sociais
- **Página de Metodologia**: Documentação completa dos 7 pilares de avaliação
- **Design System**: Componentes Shadcn/ui com tema customizado e paleta profissional
- **Integração com API**: TanStack Query para gerenciamento de estado e cache

#### **🔧 Backend (Express + Prisma + PostgreSQL)**
- **API REST Completa**: 7 endpoints funcionais + novos endpoints para Fase 3
- **Banco de Dados**: PostgreSQL hospedado no Supabase com esquema completo
- **ORM**: Prisma com relacionamentos e tipagem TypeScript
- **Dados Seed**: Políticos evangélicos reais com pontuações calculadas
- **Metodologia no DB**: 7 pilares armazenados com conteúdo dinâmico
- **Endpoints Adicionais**: Detalhes individuais, comparações, análises de votação

#### **📡 Integração com APIs Oficiais (NOVO)**
- **API Câmara dos Deputados**: Coleta automática de 513+ deputados
- **API Senado Federal**: Coleta automática de 81+ senadores
- **Sincronização de Gastos**: Análise automatizada de despesas parlamentares
- **Worker Automático**: Sistema de cron jobs para atualização contínua
- **Análise de Integridade**: Detecção automática de gastos suspeitos
- **Logs Completos**: Monitoramento de todas as sincronizações

#### **📊 Endpoints da API**
```
GET /api/politicians           - Lista de políticos com filtros
GET /api/politicians/ranking   - Ranking ordenado por pontuação
GET /api/politicians/:id       - Detalhes completos de um político
GET /api/stats/overview        - Estatísticas gerais da plataforma
GET /api/methodology/pillars   - Lista dos 7 pilares de avaliação
GET /api/methodology/content   - Conteúdo dinâmico da metodologia
GET /api/methodology/full      - Metodologia completa (pilares + conteúdo)
```

#### **🗃️ Estrutura do Banco de Dados**
- **Politicians** - Dados básicos dos parlamentares
- **PoliticianScore** - Sistema de pontuação por critério
- **Mandate** - Histórico de mandatos
- **Vote** - Votações em pautas-chave
- **KeyAgenda** - Projetos monitorados
- **Expense** - Análise de gastos parlamentares
- **MethodologyPillar** - 7 pilares de avaliação
- **MethodologyContent** - Conteúdo dinâmico

### 🏗️ Arquitetura Técnica Atual
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Hosting**: Supabase (Database) + Local Development
- **API Client**: TanStack Query
- **Icons**: Lucide React
- **Routing**: React Router DOM

### 📊 Sistema de Avaliação — 5 Critérios Ponderados

Definidos em `src/services/scoring/criteriaEngine.ts`:

| Critério | Peso | O que avalia |
|----------|------|--------------|
| 🛡️ **Proteção à Vida** | 30% | Votações sobre aborto, eutanásia e dignidade da vida |
| 👨‍👩‍👧‍👦 **Valores Familiares** | 25% | Casamento, adoção, educação e autoridade parental |
| ⚖️ **Integridade Moral** | 20% | Análise de despesas + votações de ética e anticorrupção |
| 🤝 **Responsabilidade Social** | 15% | Votações e projetos em favor de populações vulneráveis |
| ✝️ **Liberdade Religiosa** | 10% | Proteção ao culto e à expressão de fé |

**Faixas de Classificação:**
- 🟢 **Excelente** (≥ 80 pontos)
- 🟡 **Bom** (60–79 pontos)
- 🟠 **Médio** (40–59 pontos)
- 🔴 **Insuficiente** (< 40 pontos)

### 📈 Capacidade Atual da Plataforma
- **📊 Banco de Dados Populado**: 81 senadores + 600+ deputados sincronizados
- **🔄 Sincronização Automática**: APIs da Câmara e Senado integradas e funcionais
- **💰 Análise de Gastos**: Detecção automática de despesas suspeitas
- **📈 Pontuação Dinâmica**: Recálculo automático baseado em dados reais
- **🤖 Worker Automático**: Sistema de cron jobs pronto para ativação
- **📋 Metodologia Documentada**: 7 pilares com fundamentação bíblica
- **🚀 API Funcional**: Todos os 7 endpoints operacionais e testados
- **📸 Fotos Oficiais**: URLs das fotos oficiais dos parlamentares das APIs oficiais

## 🗺️ Próximos Passos

### ✅ **CONCLUÍDO - Fase 2: Expansão de Dados**
- [x] **Integração com APIs Oficiais**:
  - ✅ Scripts de coleta da API da Câmara dos Deputados
  - ✅ Scripts de coleta da API do Senado Federal
  - ✅ Sistema completo de sincronização de dados
- [x] **Workers de Sincronização**:
  - ✅ Atualização automática de dados (Worker com cron jobs)
  - ✅ Cálculo dinâmico de pontuações
  - ✅ Análise automatizada de gastos suspeitos
  - ✅ Sistema de logs e monitoramento de sincronização

### 📍 **Fase 4: Deploy e Produção** (Em Andamento)
- [x] **Primeira Sincronização Completa**:
  - ✅ Todos os senadores ativos (81/81 senadores)
  - 🔄 Todos os deputados ativos (600+/694 deputados - em progresso)
  - ⏳ Histórico de gastos parlamentares (pendente)
  - ⏳ Cálculo inicial de pontuações (pendente)
- [x] **Correções Técnicas**:
  - ✅ Configuração CORS entre Frontend e Backend
  - ✅ Parser XML para API do Senado Federal
  - ✅ Sistema de fallback para fotos de políticos
  - ✅ Seed do banco atualizado sem URLs inválidas
- [ ] **Deploy em Produção** (Próximo):
  - ⏳ Frontend: Vercel/Netlify
  - ⏳ Backend: Railway/Render
  - ⏳ Database: Supabase Pro (upgrade)
- [ ] **Otimizações e Monitoramento**:
  - ⏳ SEO avançado
  - ⏳ Performance optimization
  - ⏳ Cache strategies
  - ⏳ Analytics e error tracking

### ✅ **CONCLUÍDO - Fase 3: Funcionalidades Avançadas** 
- [x] **Páginas Individuais de Políticos**:
  - ✅ Perfil completo com histórico (/politicians/:id)
  - ✅ Gráficos de desempenho por critério (Performance Tab)
  - ✅ Análise de votações específicas (Voting History Tab)
  - ✅ Análise de gastos parlamentares (Expenses Tab)
  - ✅ Sistema de abas navegável (Overview, Performance, Voting, Expenses)
- [x] **Sistema de Comparação**:
  - ✅ Comparação de múltiplos políticos (/comparacao)
  - ✅ Seleção de até 4 políticos simultaneamente
  - ✅ Gráficos comparativos radar e barras
  - ✅ Tabelas detalhadas com rankings
  - ✅ Análises estatísticas comparativas
- [x] **Recursos Interativos**:
  - ✅ Gráficos interativos com Recharts
  - ✅ Sistema completo de compartilhamento social
  - ✅ Cards compartilháveis para download/social media
  - ✅ Suporte a WhatsApp, Twitter, Facebook, LinkedIn, Telegram
  - ✅ Dashboard de análise de votações (/analise-votacoes)

#### 📊 **Componentes Implementados na Fase 3**
- **PoliticianProfile.tsx** - Página individual completa com tabs
- **PoliticianComparison.tsx** - Sistema de comparação multi-político
- **VotingAnalysis.tsx** - Dashboard de análise de votações
- **PerformanceChart.tsx** - Gráficos radar e barras de performance
- **VotingHistoryChart.tsx** - Visualização de histórico de votações
- **ExpenseAnalysisChart.tsx** - Análise visual de gastos
- **ComparisonChart.tsx** - Gráficos comparativos interativos
- **ShareButton.tsx** - Botão de compartilhamento social
- **ShareableCard.tsx** - Cards para download e compartilhamento
- **KeyAgendaCard.tsx** - Cards de pautas-chave
- **VotingTrendsChart.tsx** - Gráficos de tendências
- **VotingStatsCard.tsx** - Cards de estatísticas

#### 📡 **Scripts de Sincronização Implementados na Fase 2**
- **sync-camara.ts** - Coleta completa de dados da Câmara dos Deputados
- **sync-senado.ts** - Coleta completa de dados do Senado Federal  
- **sync-worker.ts** - Worker automático com cron jobs para sincronização
- **expense-analyzer.ts** - Análise avançada de despesas suspeitas
- **check-progress.ts** - Monitoramento de progresso das sincronizações

#### 🔄 **Sistema de Sincronização Automática**
- **Sincronização Diária**: Políticos e dados básicos (03:00)
- **Sincronização Semanal**: Gastos parlamentares (Domingo 04:00)
- **Recálculo Diário**: Pontuações e rankings (05:00)
- **Análise Semanal**: Despesas suspeitas (Segunda 06:00)  
- **Limpeza Mensal**: Logs antigos (1º dia do mês 02:00)

## 🚀 Início Rápido

### Pré-requisitos
- **Node.js** (versão 18+)
- **pnpm** (recomendado) ou **npm**
- **PostgreSQL** (Supabase configurado)

### Instalação e Execução
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/a-bancada-evangelica.git
cd a-bancada-evangelica

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Execute as migrações do banco
pnpm db:push

# Popule dados iniciais
pnpm db:seed

# Execute o projeto completo (Frontend + API)
pnpm dev:full

# Acesse:
# Frontend: http://localhost:8080
# API: http://localhost:3001

# Comandos individuais
pnpm dev        # Apenas frontend
pnpm dev:api    # Apenas API
pnpm db:studio  # Interface visual do banco
```

### Comandos de Desenvolvimento
```bash
# Banco de dados
pnpm db:generate      # Gerar cliente Prisma
pnpm db:push          # Aplicar mudanças no schema
pnpm db:migrate       # Criar nova migração
pnpm db:seed          # Popular dados iniciais
pnpm db:studio        # Abrir Prisma Studio

# Build e Deploy
pnpm build            # Build para produção
pnpm build:dev        # Build para desenvolvimento
pnpm lint             # Execute linter
pnpm preview          # Preview da build

# Scripts de Sincronização com APIs Oficiais
pnpm sync:camara              # Sincronizar todos os deputados
pnpm sync:senado              # Sincronizar todos os senadores
pnpm sync:camara:gastos       # Sincronizar gastos específicos da Câmara
pnpm sync:senado:gastos       # Sincronizar gastos específicos do Senado
pnpm sync:worker              # Iniciar worker automático
pnpm sync:worker:list         # Listar tarefas agendadas
pnpm analyze:expenses         # Analisar despesas suspeitas
pnpm check:progress           # Verificar progresso das sincronizações
```

## 🏗️ Estrutura do Projeto

```
├── src/
│   ├── api/                 # Backend Express.js
│   │   └── server.ts        # Servidor principal da API
│   ├── components/          # Componentes React
│   │   ├── layout/          # Header, Footer
│   │   ├── politicians/     # PoliticianCard, etc.
│   │   ├── charts/          # PerformanceChart, VotingHistoryChart, etc.
│   │   ├── comparison/      # PoliticianSelector, ComparisonChart, etc.
│   │   ├── social/          # ShareButton, ShareableCard
│   │   ├── voting/          # KeyAgendaCard, VotingTrendsChart, etc.
│   │   └── ui/             # Componentes Shadcn/ui
│   ├── hooks/              # Custom hooks
│   │   ├── usePoliticians.ts # Hook para dados de políticos
│   │   ├── usePoliticianDetail.ts # Hook para detalhes individuais
│   │   ├── useComparisonData.ts # Hook para comparações
│   │   ├── useVotingAnalysisData.ts # Hook para análise de votações
│   │   └── useScores.ts     # Hook para pontuações
│   ├── lib/                # Utilitários
│   │   ├── prisma.ts       # Cliente Prisma
│   │   └── queryClient.ts  # Configuração TanStack Query
│   ├── pages/              # Páginas da aplicação
│   │   ├── Ranking.tsx     # Página principal
│   │   ├── PoliticianProfile.tsx # Perfil individual com tabs
│   │   ├── PoliticianComparison.tsx # Comparação de políticos
│   │   ├── VotingAnalysis.tsx # Dashboard de análise de votações
│   │   └── Metodologia.tsx # Documentação completa
│   └── types/              # Definições TypeScript
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
├── scripts/               # Scripts de sincronização com APIs
│   ├── sync-camara.ts     # Sincronização API Câmara dos Deputados
│   ├── sync-senado.ts     # Sincronização API Senado Federal
│   ├── sync-worker.ts     # Worker automático com cron jobs
│   ├── expense-analyzer.ts # Análise de despesas suspeitas
│   ├── check-progress.ts  # Monitoramento de progresso
│   └── seed-methodology.ts # Seed da metodologia
└── public/                # Assets estáticos
```

## 🛠️ Stack Tecnológica Completa

### 🎯 Frontend
```
React 18.3.1           - Framework principal
TypeScript 5.8.3       - Tipagem estática
Vite 5.4.19            - Build tool e dev server
Tailwind CSS 3.4.17    - Framework CSS utility-first
Shadcn/ui              - Biblioteca de componentes
React Router 6.30.1    - Roteamento SPA
TanStack Query 5.90.5  - Gerenciamento de estado e cache
Lucide React 0.462.0   - Ícones SVG otimizados
Recharts 2.13.4        - Gráficos interativos
Html2canvas             - Geração de imagens para compartilhamento
```

### 🚀 Backend
```
Express.js 5.1.0       - Framework web
TypeScript 5.8.3       - Tipagem estática
Prisma 5.20.0          - ORM e cliente de banco
PostgreSQL             - Banco de dados principal
Supabase               - Hosting do banco de dados
CORS 2.8.5             - Cross-origin resource sharing (configurado)
TSX 4.19.2             - Executor TypeScript
Axios 1.12.2           - Cliente HTTP para APIs oficiais
Node-cron 4.2.1        - Agendamento de tarefas automáticas
Node-fetch 3.3.2       - Requisições HTTP para APIs externas
xml2js 0.6.2           - Parser XML para API do Senado Federal
```

### 🗄️ Database Schema
```
15 Tabelas principais:
- politicians          # Dados dos parlamentares
- politician_scores    # Sistema de pontuação
- mandates            # Histórico de mandatos
- votes               # Votações monitoradas
- key_agendas         # Pautas importantes
- expenses            # Gastos parlamentares
- expense_analysis    # Análise automatizada de gastos
- methodology_pillars # 7 pilares de avaliação
- methodology_content # Conteúdo dinâmico
- sync_logs           # Logs de sincronização
- system_configs      # Configurações do sistema
- api_requests        # Log de requisições às APIs
```

### 📡 **APIs Integradas**
```
🏛️ Câmara dos Deputados:
- https://dadosabertos.camara.leg.br/api/v2
- Deputados, mandatos, votações, gastos

🏛️ Senado Federal:
- https://legis.senado.leg.br/dadosabertos
- Senadores, mandatos, gastos

🗳️ Integração TSE (Próximo):
- Dados eleitorais e candidaturas
```

## 🤝 Contribuindo

Este projeto tem potencial para **impacto cívico significativo**. Contribuições são bem-vindas!

### 🔧 Como Contribuir
1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/a-bancada-evangelica.git`
3. **Configure** o ambiente local (banco de dados, etc.)
4. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
5. **Faça** suas alterações e commit: `git commit -m 'feat: adiciona nova funcionalidade'`
6. **Push** para a branch: `git push origin feature/nova-funcionalidade`
7. **Abra** um Pull Request

### 🎯 Áreas que Precisam de Contribuição
| Área | Descrição | Skill Level |
|------|-----------|-------------|
| 🔌 **Integração APIs** | Scripts para APIs da Câmara/Senado | Intermediário |
| 📊 **Análise de Dados** | Algoritmos de pontuação e análise | Avançado |
| 🎨 **Frontend** | Páginas individuais, gráficos, UX/UI | Intermediário |
| 📝 **Conteúdo** | Textos para metodologia e documentação | Iniciante |
| 🔍 **Pesquisa** | Refinamento de critérios de avaliação | Iniciante |
| ⚡ **Performance** | Otimizações de banco e cache | Avançado |

### 📋 Diretrizes Técnicas
- Siga os padrões TypeScript existentes
- Use Prisma para todas as operações de banco
- Implemente testes para novas funcionalidades
- Documente APIs com JSDoc
- Use commits semânticos (`feat:`, `fix:`, `docs:`, etc.)

## 📊 Metodologia Transparente

A metodologia completa está documentada na [página de metodologia](http://localhost:8080/metodologia) e inclui:

- **Fundamentação bíblica** para cada critério
- **Indicadores específicos** de avaliação
- **Transparência total** sobre limitações e garantias
- **Processo de revisão** por equipe multidisciplinar
- **Código aberto** para auditoria independente

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE) - veja o arquivo LICENSE para detalhes.

## 📞 Contato & Suporte

### 💬 Canais de Comunicação
- **Issues**: [Reportar bugs ou sugerir melhorias](../../issues)
- **Discussions**: [Participar de discussões](../../discussions)
- **Email**: Através da [página de contato](http://localhost:8080/contato) do projeto

### 🆘 Precisa de Ajuda?
- Consulte a [documentação técnica](./CLAUDE.md)
- Verifique as [issues abertas](../../issues)
- Participe das [discussões da comunidade](../../discussions)

---

<div align="center">

### 🙏 Oremos para que este projeto impacte positivamente nossa democracia

> *"A plataforma A Bancada Evangélica não é uma lista de 'políticos aprovados', mas sim uma ferramenta de discernimento."*

> *"Toda autoridade vem de Deus, e as autoridades que existem foram por ele estabelecidas."*
> **Romanos 13:1**

**A Bancada Evangélica** • **Sistema completo funcionando** • Contribuições bem-vindas

[![Licença MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![API](https://img.shields.io/badge/API-7%20Endpoints-green?style=flat-square)](http://localhost:3001)

</div>