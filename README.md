# LumniPsi

Plataforma clinica para psicologia com prontuario, agenda, documentos, registros restritos, portal do cliente e assistente integrado.

## Status

Estado atual em `2026-03-09`:

- MVP funcional fechado
- backend e frontend integrados
- autenticacao com refresh token
- PIN secundario para area restrita
- exportacao de documentos em PDF
- gestao administrativa de contas do portal
- documentacao tecnica detalhada em `docs/`

## Stack

- `apps/api`: Express + Prisma + Zod + JWT
- `apps/web`: React + Vite + Tailwind
- `packages/shared`: constantes e utilitarios compartilhados
- `prisma`: schema, migrations e seed do PostgreSQL

## Principais funcionalidades

- login interno com RBAC por papel
- renovacao automatica de sessao por refresh token
- cadastro de pacientes
- agenda clinica e bloqueios administrativos
- evolucoes
- registros restritos protegidos por PIN
- emissao e edicao de documentos
- exportacao interna de PDF
- upload de assinatura profissional
- portal para paciente e responsavel
- notificacoes
- configuracoes institucionais de retencao e descarte
- assistente com IA

## Estrutura do repositorio

```text
.
|-- apps/
|   |-- api/
|   `-- web/
|-- packages/
|   `-- shared/
|-- prisma/
|-- scripts/
|-- docs/
|-- codigo_mvp.md
`-- README.md
```

## Como rodar localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar ambiente

Crie um `.env` com pelo menos:

```env
PORT=3333
APP_URL=http://localhost:4173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lumnipsi
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
ASSISTANT_ENABLED=true
```

### 3. Preparar banco

```bash
npm run db:setup
```

### 4. Subir backend e frontend

Em dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

## Scripts principais

```bash
npm run dev:web
npm run dev:api
npm run lint
npm run typecheck
npm run build
npm test
npm run smoke:api
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## Credenciais de seed

Area interna:

- `demo@lumnipsi.app / LumniPsi@123`
- `recepcao@lumnipsi.app / Recepcao@123`

Portal:

- `portal.helena@example.com / Portal@123`

PIN demo:

- `4321`

## Documentacao

Documentacao detalhada disponivel em:

- [docs/README.md](./docs/README.md)
- [docs/architecture.md](./docs/architecture.md)
- [docs/backend.md](./docs/backend.md)
- [docs/frontend.md](./docs/frontend.md)
- [docs/database.md](./docs/database.md)
- [docs/api-reference.md](./docs/api-reference.md)
- [docs/auth-and-security.md](./docs/auth-and-security.md)
- [docs/development-and-operations.md](./docs/development-and-operations.md)
- [docs/diretrizes_cfp.md](./docs/diretrizes_cfp.md)

## Observacoes importantes

- o banco usa Prisma com PostgreSQL;
- o storage de assinatura no MVP e local, em `/tmp/lumnipsi-uploads`;
- o portal externo usa autenticacao propria;
- registros restritos exigem PIN secundario;
- o assistente funciona em modo fallback se `OPENAI_API_KEY` nao estiver definida.
