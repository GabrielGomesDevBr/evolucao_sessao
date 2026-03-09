# Documentacao Tecnica LumniPsi

Esta pasta concentra a documentacao tecnica detalhada da aplicacao. A ideia e permitir que um desenvolvedor novo entre no projeto e entenda a estrutura completa sem precisar descobrir tudo diretamente pelo codigo.

## Ordem recomendada de leitura

1. [architecture.md](./architecture.md)
2. [backend.md](./backend.md)
3. [frontend.md](./frontend.md)
4. [database.md](./database.md)
5. [api-reference.md](./api-reference.md)
6. [auth-and-security.md](./auth-and-security.md)
7. [development-and-operations.md](./development-and-operations.md)
8. [diretrizes_cfp.md](./diretrizes_cfp.md)

## O que cada arquivo cobre

- `architecture.md`: visao geral do monorepo, modulos, fluxo de dados e principios de organizacao.
- `backend.md`: API Express, middlewares, modulos, responsabilidades e convencoes do servidor.
- `frontend.md`: arquitetura React, providers, estado global, rotas e comportamento das telas.
- `database.md`: modelo Prisma, entidades, enums, relacoes, migracoes e seed.
- `api-reference.md`: referencia de endpoints, autenticacao exigida, papeis e payloads.
- `auth-and-security.md`: autenticacao principal, refresh token, PIN secundario, RBAC e auditoria.
- `development-and-operations.md`: setup, scripts, ambiente, storage local, testes e troubleshooting.
- `diretrizes_cfp.md`: diretrizes normativas e impactos praticos do CFP sobre conteudo, sigilo e fluxos documentais.

## Padrao editorial adotado

Os documentos desta pasta seguem o mesmo criterio:

- titulo direto e focado no dominio documentado;
- texto em portugues tecnico;
- estrutura por secoes curtas e objetivas;
- listas planas para facilitar manutencao;
- referencias a arquivos e comportamentos reais do codigo atual.

## Escopo atual da documentacao

Esta documentacao reflete o estado do projeto em `2026-03-09`, apos o fechamento do checklist de MVP em [codigo_mvp.md](../codigo_mvp.md).
