# Desenvolvimento e Operacao

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL acessivel pela `DATABASE_URL`

## Variaveis de ambiente

Arquivo lido:

- `.env`

Schema validado em:

- `apps/api/src/config/env.ts`

Variaveis suportadas:

- `NODE_ENV`
- `PORT`
- `APP_URL`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ASSISTANT_ENABLED`
- `ASSISTANT_ALLOW_DB_WRITE`
- `ASSISTANT_SYSTEM_NAME`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `PRISMA_SLOW_QUERY_MS`

Observacao:

- nem todas as variaveis de storage estao plenamente usadas no MVP;
- o provider real atual continua sendo o storage local em `/tmp`.
- `PRISMA_SLOW_QUERY_MS` define o limiar para log de query lenta do Prisma.

## Scripts do monorepo

Arquivo:

- `package.json`

Principais comandos:

- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run db:push`
- `npm run db:reset`
- `npm run db:seed`
- `npm run db:setup`
- `npm run smoke:api`

## Fluxo recomendado para subir localmente

1. instalar dependencias com `npm install`
2. configurar `.env`
3. preparar banco com `npm run db:setup`
4. subir API com `npm run dev:api`
5. subir frontend com `npm run dev:web`

## Seed e credenciais

O seed cria dados suficientes para demonstracao e testes manuais.

Credenciais internas:

- `demo@lumnipsi.app / LumniPsi@123`
- `recepcao@lumnipsi.app / Recepcao@123`

Credencial do portal:

- `portal.helena@example.com / Portal@123`

PIN demo:

- `4321`

## Prisma e banco

Arquivos centrais:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `prisma/seed.ts`

Estado atual do baseline:

- `0001_init` e `0002_tenant_policy_and_portal_revocation` ja estao marcadas como aplicadas no banco remoto;
- o status atual do Prisma esta sincronizado.

## Testes

### Automatizados

Comando:

- `npm test`

Cobertura atual:

- helpers de autenticacao;
- helpers de healthcheck;
- geracao de PDF.

Arquivos:

- `apps/api/src/lib/auth.test.ts`
- `apps/api/src/lib/health.test.ts`
- `apps/api/src/lib/pdf.test.ts`

### Smoke test

Comando:

- `npm run smoke:api`

Script:

- `scripts/smoke-api.sh`

Fluxos verificados:

- `/health`
- login interno
- verificacao de PIN
- login do portal

## Health endpoints

Rotas operacionais:

- `GET /live`
- `GET /ready`
- `GET /health`

Uso recomendado:

- `live`: probe de processo
- `ready`: readiness probe para balanceador ou orquestrador
- `health`: consulta humana ou automacao simples

## Logs e observabilidade

O backend emite logs estruturados JSON com:

- `timestamp`
- `level`
- `service`
- `event`

Eventos relevantes atuais:

- `api_started`
- `api_shutdown_started`
- `api_shutdown_completed`
- `api_startup_failed`
- `database_connected`
- `database_connection_failed`
- `database_healthcheck_failed`
- `prisma_warn`
- `prisma_error`
- `prisma_slow_query`
- `http_request_completed`
- `http_request_warning`
- `http_request_failed`
- `http_unhandled_error`

Correlacao:

- toda request recebe `x-request-id`;
- respostas JSON retornam `meta.requestId`;
- erros inesperados tambem carregam esse identificador.

## Build e qualidade

Comandos de validacao usados no dia a dia:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Storage de arquivos

Estado atual:

- assinatura e salva em `/tmp/lumnipsi-uploads`;
- a URL publica e montada em `/storage/<arquivo>`.

Implicacoes:

- o arquivo pode sumir em reinicio do ambiente;
- em producao, esse mecanismo deve ser substituido.

## PWA

O frontend gera:

- `manifest.webmanifest`
- `sw.js`
- `workbox-*.js`

O registro usa modo `prompt`, entao a instalacao e opcional e controlada pela UI.

## Boas praticas para evolucao do projeto

- manter a API tenant-aware em toda query nova;
- adicionar Zod em todo endpoint novo;
- auditar eventos sensiveis;
- manter CRUD principal centralizado no `AppStateProvider` ate surgir necessidade real de outra abordagem;
- preferir migracoes Prisma a alteracoes manuais diretas;
- se um banco ja existir fora do historico do Prisma, usar `migrate resolve` com cuidado antes de qualquer reset.

## Troubleshooting

### `prisma migrate dev` pede reset por drift

Contexto:

- isso ja aconteceu neste projeto quando o schema remoto existia, mas o historico de migrations nao estava registrado.

Abordagem correta:

1. verificar se o schema real ja corresponde ao esperado;
2. se a alteracao for aditiva e segura, aplicar SQL diretamente;
3. marcar a migration como aplicada com `prisma migrate resolve`;
4. confirmar com `prisma migrate status`.

### frontend autenticado cai para login

Verificar:

- expiracao do access token;
- refresh token invalido;
- falha de `/auth/refresh`;
- mismatch entre `APP_URL`, `VITE_API_URL` e CORS.

### registros restritos nao carregam

Verificar:

- se o usuario configurou PIN;
- se o `pinToken` ainda esta valido;
- se o header `x-pin-token` esta sendo enviado.

### assinatura nao aparece

Verificar:

- upload em `/uploads/signature`;
- vinculacao em `/professional/me/signature`;
- arquivo presente em `/tmp/lumnipsi-uploads`;
- acesso a URL `/storage/...`.

### readiness falha mas a API responde

Verificar:

- status de `/ready`;
- conectividade com o banco configurado em `DATABASE_URL`;
- logs `database_healthcheck_failed`;
- se a API entrou em shutdown gracioso.
