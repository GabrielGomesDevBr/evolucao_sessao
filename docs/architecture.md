# Arquitetura

## Visao geral

LumniPsi e um monorepo Node.js com tres blocos principais:

- `apps/api`: backend HTTP em Express.
- `apps/web`: frontend React com Vite.
- `packages/shared`: constantes e tipos compartilhados entre camadas.

O banco de dados e definido por Prisma em `prisma/schema.prisma` e usa PostgreSQL.

## Objetivo do produto

A aplicacao centraliza operacao clinica de psicologia em um unico fluxo:

- autenticacao de profissionais e equipe;
- cadastro e acompanhamento de pacientes;
- agenda clinica;
- evolucoes;
- registros restritos com dupla verificacao por PIN;
- documentos clinicos;
- portal externo para paciente e responsavel;
- notificacoes internas;
- configuracoes institucionais;
- assistente com IA.

## Estrutura do monorepo

```text
.
|-- apps/
|   |-- api/
|   `-- web/
|-- packages/
|   `-- shared/
|-- prisma/
|   |-- migrations/
|   |-- schema.prisma
|   `-- seed.ts
|-- scripts/
|   `-- smoke-api.sh
|-- codigo_mvp.md
`-- README.md
```

## Fluxo de alto nivel

```mermaid
flowchart LR
  UI[React Web App] -->|fetch / JSON| API[Express API]
  API -->|Prisma Client| DB[(PostgreSQL)]
  API -->|static /storage| FS[/tmp/lumnipsi-uploads]
  API -->|LangChain / OpenAI| LLM[OpenAI]
  Portal[Portal externo] -->|JWT portal| API
```

## Padrao de responsabilidades

### Backend

- `src/index.ts` monta middlewares globais e registra rotas.
- cada modulo em `src/modules/<modulo>` concentra rotas e, quando necessario, servicos auxiliares;
- `src/lib` guarda bibliotecas internas reutilizaveis, como auth, audit, PDF, Prisma e storage;
- `src/config/env.ts` valida as variaveis de ambiente.

### Frontend

- `src/main.tsx` monta os providers globais;
- `src/app/router.tsx` define as rotas e a protecao de sessao;
- `src/app/state` concentra estado compartilhado da aplicacao;
- `src/features` organiza as telas por dominio;
- `src/components` guarda layout e componentes transversais.

### Shared

- `packages/shared/src/index.ts` exporta listas padrao, labels e textos de apoio usados pelo frontend.

## Providers do frontend

Ordem de montagem em `apps/web/src/main.tsx`:

1. `QueryClientProvider`
2. `FeedbackProvider`
3. `AuthProvider`
4. `AppStateProvider`
5. `BrowserRouter`

Consequencia pratica:

- autenticacao fica disponivel antes do carregamento dos dados clinicos;
- feedback visual de sucesso/erro pode ser disparado por qualquer tela;
- o estado de dominio depende de autenticacao valida.

## Fluxo de carregamento apos login

1. usuario faz login em `/auth/login`;
2. frontend salva `token` e `refreshToken` em `localStorage`;
3. `AppStateProvider` executa `refresh()` quando a sessao esta autenticada;
4. a aplicacao busca em paralelo:
   - `/patients`
   - `/calendar`
   - `/sessions`
   - `/documents`
   - `/professional/me`
5. se houver PIN valido em memoria, tambem busca `/records`.

## Fluxo de seguranca por camadas

- `access token`: protege toda a area interna.
- `refresh token`: renova sessao sem novo login.
- `portal token`: separa o acesso do portal do acesso interno.
- `pin token`: protege a area de registros restritos.
- `requireRole`: controla permissao por papel.
- `AuditLog`: registra eventos criticos no banco.

## Decisoes importantes de arquitetura

- monorepo simples com npm workspaces, sem orquestrador adicional;
- backend em Express, sem framework opinionado, para acelerar o MVP;
- Prisma como camada unica de acesso a dados;
- estado global do frontend com Context API, sem Redux;
- armazenamento de assinatura em disco local exposto por `/storage`;
- PWA no frontend via `vite-plugin-pwa`;
- assistente desacoplado do restante da API por modulo proprio.

## Onde comecar ao entrar no projeto

Se voce for novo no codigo, a ordem mais eficiente para leitura pratica e:

1. `apps/api/src/index.ts`
2. `apps/web/src/app/router.tsx`
3. `apps/web/src/app/state/auth-state.tsx`
4. `apps/web/src/app/state/app-state.tsx`
5. `prisma/schema.prisma`

Isso da uma visao praticamente completa do sistema antes de entrar em cada tela ou endpoint.
