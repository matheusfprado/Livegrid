# Livegrid

Livegrid e um monorepo open source para uma plataforma de comunicacao em tempo real inspirada em servidores de comunidade: contas, servidores, convites, canais de texto, canais de voz, salas LiveKit, camera, microfone e multiplos compartilhamentos de tela.

O objetivo do projeto e ser simples de rodar localmente, facil de contribuir e suficientemente organizado para crescer sem virar um bloco unico.

## Status

MVP funcional:

- criacao de conta com email e senha;
- login com sessao;
- criacao de servidores;
- entrada em servidores por convite;
- canais de texto e mensagens persistidas;
- canais de voz;
- criacao de salas de chamada por canal de voz;
- entrada em sala por codigo;
- integracao LiveKit para audio, camera e compartilhamento de tela;
- multiplos compartilhamentos de tela por participante;
- encerramento de sala pelo host;
- validacao compartilhada com Zod;
- Prisma com migrations;
- CI com lint, typecheck, testes e build.

Ainda nao e uma versao 1.0. Existem areas abertas para contribuicao, principalmente realtime de chat, permissoes avancadas, UX mobile, testes e deploy.

## Stack

- Monorepo: pnpm workspaces + Turbo
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Fastify, TypeScript, Zod
- Banco: PostgreSQL via Prisma
- Banco recomendado: Supabase Postgres
- Midia em tempo real: LiveKit
- UI: componentes React compartilhados em `packages/ui`
- Logs: Pino

## Estrutura

```text
apps/
  api/                  Fastify API
  web/                  Next.js frontend
packages/
  config/               schemas de ambiente e constantes
  database/             Prisma schema, migrations e client
  livekit/              tokens e permissoes LiveKit
  logger/               logger compartilhado
  types/                tipos compartilhados
  ui/                   componentes React compartilhados
  validation/           schemas Zod compartilhados
tooling/
  eslint/               configs ESLint internas
  prettier/             config Prettier
  typescript/           configs TypeScript internas
docs/
  agents/               agentes de manutencao/review do projeto
  skills/               skills Codex especificas do Livegrid
```

## Requisitos

- Node.js 22 ou superior
- pnpm 11 ou superior
- Uma instancia PostgreSQL
- LiveKit Cloud ou LiveKit self-hosted
- Git

## Instalacao Local

Instale dependencias:

```bash
pnpm install
```

Copie os arquivos de ambiente:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

No Windows PowerShell, use:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item packages/database/.env.example packages/database/.env
```

Configure os valores reais nos arquivos `.env`.

## Variaveis De Ambiente

### API

Arquivo: `apps/api/.env`

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=
DIRECT_URL=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
WEB_URL=http://localhost:3000
```

### Web

Arquivo: `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_LIVEKIT_URL=
```

### Database Package

Arquivo: `packages/database/.env`

```env
DATABASE_URL=
DIRECT_URL=
```

Nunca coloque segredo real em `.env.example`, README, issues, prints, logs ou mensagens publicas.

## Supabase

O projeto usa PostgreSQL e foi pensado para rodar bem com Supabase.

No Supabase Dashboard, abra:

```text
Connect > ORMs > Prisma
```

Use:

- Session Pooler URL em `DATABASE_URL`;
- Direct Connection URL em `DIRECT_URL`.

Configure os dois em:

```text
apps/api/.env
packages/database/.env
```

Depois rode migrations:

```bash
pnpm db:migrate
```

Para prototipagem local, `pnpm db:push` tambem existe, mas contribuicoes que mudam schema devem adicionar migration.

## LiveKit

Crie um projeto no LiveKit Cloud ou rode LiveKit local.

Configure na API:

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Sem essas variaveis, a aplicacao ainda carrega, mas chamadas de audio/video retornam erro de midia nao configurada.

## Rodando O Projeto

Suba API e web juntos:

```bash
pnpm dev
```

Padroes locais:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Healthcheck API: `http://localhost:4000/health`

## Scripts

```bash
pnpm dev           # roda apps em modo desenvolvimento
pnpm lint          # ESLint em todos os packages/apps
pnpm typecheck     # TypeScript sem emitir arquivos
pnpm test          # testes automatizados
pnpm build         # build de packages, API e web
pnpm db:migrate    # aplica migrations Prisma
pnpm db:push       # sincroniza schema sem migration, uso local/prototipo
pnpm format        # Prettier
pnpm hooks:install # instala hooks locais de Git
```

## Fluxo De Contribuicao

Este repo nao deve receber push direto na `main`.

Fluxo esperado:

1. Crie uma branch a partir de `main`.
2. Faca a alteracao.
3. Crie ou atualize `BRANCH_README.md` explicando o que foi feito na branch.
4. Rode os checks locais.
5. Abra Pull Request para `main`.
6. Aguarde CI e review.

Exemplo:

```bash
git checkout main
git pull
git checkout -b feat/realtime-chat
pnpm hooks:install
```

## BRANCH_README.md

Toda branch de contribuicao deve ter um `BRANCH_README.md` na raiz do repo.

Esse arquivo serve para o mantenedor entender rapidamente:

- qual problema a branch resolve;
- quais arquivos/areas foram alterados;
- como testar;
- riscos conhecidos;
- prints ou evidencias quando houver UI.

Use o template em [BRANCH_README.template.md](BRANCH_README.template.md).

O CI valida que `BRANCH_README.md` existe em Pull Requests. A regra nao substitui review, mas evita PRs sem contexto.

## Protecao Da Branch Main

O repo contem hook local para bloquear push direto na `main`, mas a protecao real deve ser ativada no GitHub.

Instale hooks locais:

```bash
pnpm hooks:install
```

Ative tambem no GitHub:

```text
Settings > Branches > Add branch protection rule
Branch name pattern: main
Require a pull request before merging: enabled
Require status checks to pass before merging: enabled
Require branches to be up to date before merging: enabled
Restrict who can push to matching branches: enabled
Include administrators: enabled
Do not allow bypassing the above settings: enabled
```

Status checks recomendados:

- `checks`

## Testes

Os testes atuais cobrem permissoes criticas de rooms privadas no backend.

Rode:

```bash
pnpm test
```

Contribuicoes de bug fix devem adicionar teste de regressao quando for pratico.

## Seguranca

Pontos importantes:

- sessoes e host tokens sao sensiveis;
- secrets LiveKit ficam somente na API;
- URLs reais de banco nunca devem entrar em arquivos versionados;
- rotacione qualquer segredo que ja tenha sido commitado ou compartilhado;
- rotas publicas de auth, convites e rooms possuem rate limit basico.

Veja [SECURITY.md](SECURITY.md).

## Roadmap Para Contribuidores

Boas primeiras areas:

- realtime para mensagens de texto;
- estado de participante saindo da sala;
- painel de configuracoes de audio/video;
- permissoes por role no servidor;
- listagem e revogacao de convites;
- testes de API para auth e servidores;
- testes de UI para fluxos principais;
- melhoria de acessibilidade;
- guia de deploy.

## Licenca

MIT. Veja [LICENSE](LICENSE).
