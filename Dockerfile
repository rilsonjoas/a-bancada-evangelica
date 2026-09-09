FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm 10+ (baixado automaticamente pelo corepack) removeu a sintaxe
# --flag=valor para flags booleanas: "--prod=false" agora é erro fatal
# ("unexpected value 'false' for '--prod'"). Sem o --prod, o pnpm já
# instala dependencies + devDependencies por padrão — comportamento
# idêntico ao "--prod=false" antigo. Achado real 2026-09-09 (run
# 34293823596, "Deploy VPS" falhou em 26s no build da imagem).
RUN pnpm install

COPY . .

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm db:generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "api-server.cjs"]
