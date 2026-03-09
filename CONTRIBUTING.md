# Contributing

## Objetivo

Este documento define o fluxo minimo de colaboracao para manter o repositorio organizado desde os primeiros ciclos de desenvolvimento.

## Branch principal

- `main`: branch estavel e fonte da verdade do projeto.

Regra:

- nao trabalhar diretamente em `main` para mudancas normais;
- usar `main` apenas para sincronizacao local, releases simples ou hotfix extremamente controlado.

## Convencao de branches

Use nomes curtos, previsiveis e legiveis.

Padrao:

```text
<tipo>/<escopo>-<descricao>
```

Exemplos:

- `feature/api-portal-revocation`
- `feature/web-document-export`
- `fix/api-refresh-token`
- `fix/web-calendar-overlap`
- `chore/docs-onboarding`
- `chore/ci-github-actions`

Tipos recomendados:

- `feature`: nova funcionalidade
- `fix`: correcao de bug
- `chore`: manutencao tecnica, docs, tooling, refatoracao pequena
- `hotfix`: correcao urgente com impacto imediato em producao

## Fluxo recomendado

1. atualizar a branch local principal:

```bash
git checkout main
git pull origin main
```

2. criar uma branch nova:

```bash
git checkout -b feature/web-nova-tela
```

3. desenvolver e validar localmente:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

4. criar commits pequenos e descritivos;
5. abrir Pull Request para `main`;
6. mergear apenas apos CI verde e revisao suficiente para o risco da mudanca.

## Convencao de commits

Padrao recomendado:

```text
<tipo>: <descricao curta>
```

Exemplos:

- `feat: add portal account reactivation flow`
- `fix: handle expired pin token in app state`
- `docs: expand backend architecture guide`
- `chore: configure github actions ci`

Tipos recomendados:

- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`

## Pull Requests

Toda PR deve responder claramente:

- o que mudou;
- por que mudou;
- como foi validado;
- se ha impacto em banco, API, seguranca ou rollout.

Use o template em `.github/pull_request_template.md`.

## Checklist minimo antes de abrir PR

- codigo compila;
- `lint` passa;
- `typecheck` passa;
- `build` passa;
- testes automatizados passam;
- documentacao foi atualizada quando a mudanca alterou arquitetura, API, banco ou fluxo de uso.

## Mudancas de banco

Quando alterar schema Prisma:

1. atualizar `prisma/schema.prisma`;
2. criar migration correspondente;
3. rodar `npm run prisma:generate`;
4. validar impacto em seed e documentacao.

Se o banco remoto ja existir e houver historico divergente:

- nao usar reset sem necessidade real;
- preferir alinhar com `prisma migrate resolve` quando o schema real ja estiver aplicado.

## Mudancas sensiveis

Exigem mais cuidado:

- autenticacao
- refresh token
- PIN secundario
- RBAC
- registros restritos
- compartilhamento com portal
- PDF clinico
- migracoes Prisma

Nesses casos, a PR deve descrever risco e validacao com mais rigor.
