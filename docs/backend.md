# Backend

## Stack

- Node.js
- Express
- Prisma Client
- Zod para validacao
- JWT para autenticacao
- bcryptjs para hash de senha e PIN
- LangChain + OpenAI no modulo do assistente

## Ponto de entrada

Arquivo principal: `apps/api/src/index.ts`

Responsabilidades:

- configurar CORS;
- configurar `express.json`;
- expor `/storage` como arquivo estatico;
- responder `/health`;
- montar todos os modulos da API;
- iniciar o servidor HTTP.

## Middlewares globais

### CORS

Aceita:

- `env.APP_URL`
- `http://localhost:4173`
- `http://localhost:4174`
- `http://127.0.0.1:4173`
- `http://127.0.0.1:4174`
- IPs locais nas faixas `192.168.x.x` e `10.x.x.x`

### JSON body

- limite atual: `2mb`

### Storage estatico

- rota publica: `/storage`
- raiz local: `/tmp/lumnipsi-uploads`

## Estrutura interna do backend

```text
apps/api/src/
|-- config/
|   `-- env.ts
|-- lib/
|   |-- audit.ts
|   |-- auth.ts
|   |-- http.ts
|   |-- pdf.ts
|   |-- prisma.ts
|   `-- storage.ts
|-- modules/
|   |-- assistant/
|   |-- auth/
|   |-- calendar/
|   |-- documents/
|   |-- notifications/
|   |-- patients/
|   |-- portal/
|   |-- professional/
|   |-- records/
|   |-- sessions/
|   |-- settings/
|   `-- uploads/
`-- index.ts
```

## Contrato de resposta

O backend usa helpers de `lib/http.ts` para devolver:

- sucesso: `{ data: ... }`
- erro: `{ error: "mensagem" }`

O frontend depende desse contrato em `apps/web/src/lib/api.ts`.

## Autenticacao e autorizacao

### `requireAuth`

- le `Authorization: Bearer <token>`
- valida JWT de acesso
- injeta `req.auth`

### `requireRole`

- recebe lista de papeis permitidos
- compara com `req.auth.role`

### `requirePin`

- le header `x-pin-token`
- valida escopo `pin`
- garante que o token de PIN pertence ao mesmo usuario e tenant da sessao principal

## Montagem das rotas

### Publicas

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /portal/auth/login`
- `GET /portal/me`
- `GET /portal/me/documents`
- `GET /portal/me/appointments`

Observacao: as tres rotas `GET /portal/me*` sao "publicas" apenas no sentido de nao passarem por `requireAuth`; elas usam autenticacao propria do portal.

### Internas autenticadas

- `/patients`
- `/calendar`
- `/sessions`
- `/documents`
- `/uploads`
- `/portal` interno
- `/professional`
- `/assistant`
- `/notifications`
- `/settings`
- `/records`
- `/admin/users`

## Papeis e acesso por modulo

### Roles clinicos

Usados em:

- `/sessions`
- `/documents`
- `/assistant`
- `/records`

Papeis:

- `OWNER`
- `ADMIN`
- `PROFESSIONAL`
- `INTERN`

### Roles operacionais

Usados em:

- `/patients`
- `/calendar`
- `/portal`
- `/professional`

Papeis:

- `OWNER`
- `ADMIN`
- `PROFESSIONAL`
- `RECEPTION`
- `INTERN`

### Settings

Somente:

- `OWNER`
- `ADMIN`

## Modulos do backend

### Auth

Arquivos:

- `modules/auth/auth.routes.ts`
- `modules/auth/auth.middleware.ts`
- `modules/auth/pin.middleware.ts`

Responsavel por:

- cadastro inicial do tenant e owner;
- login interno;
- refresh de sessao;
- configuracao de PIN;
- verificacao de PIN.

### Patients

Arquivo:

- `modules/patients/patients.routes.ts`

Responsavel por:

- listar pacientes do tenant;
- criar paciente;
- editar paciente;
- excluir paciente.

Escopo:

- sempre filtrado por `tenantId` da sessao.

### Calendar

Arquivo:

- `modules/calendar/calendar.routes.ts`

Responsavel por CRUD de agendamentos.

Caracteristicas:

- suporta compromisso vinculado a paciente ou bloqueio administrativo sem paciente;
- guarda status, horario, cor e notas internas.

### Sessions

Arquivo:

- `modules/sessions/sessions.routes.ts`

Responsavel por CRUD de evolucoes clinicas.

### Records

Arquivo:

- `modules/records/records.routes.ts`

Responsavel por CRUD de registros restritos.

Diferencial:

- exige `requirePin`;
- registra auditoria de eventos sensiveis.

### Documents

Arquivo:

- `modules/documents/documents.routes.ts`

Responsavel por:

- listar documentos;
- criar e editar documentos;
- excluir documentos;
- exportar PDF em `/documents/:id/pdf`.

Observacoes:

- documentos podem ser marcados com `shareWithPortal`;
- exportacao em PDF e gerada internamente em `lib/pdf.ts`;
- cada exportacao gera evento de auditoria `EXPORTED`.

### Uploads

Arquivo:

- `modules/uploads/uploads.routes.ts`

Responsavel por:

- upload de metadados;
- upload real de assinatura em base64.

Uso atual:

- assinatura profissional.

### Professional

Arquivo:

- `modules/professional/professional.routes.ts`

Responsavel por:

- retornar perfil do profissional logado;
- atualizar dados profissionais;
- vincular assinatura enviada por upload.

### Portal

Arquivos:

- `modules/portal/portal.routes.ts`
- `modules/portal/portal-auth.middleware.ts`

Divide o dominio em dois lados:

- portal publico do paciente/responsavel;
- administracao interna das contas do portal.

Fluxos internos implementados:

- listar contas;
- criar conta;
- editar conta;
- revogar acesso;
- reativar acesso;
- redefinir senha;
- consultar documentos compartilhados por paciente.

Fluxos do portal:

- login do paciente/responsavel;
- consultar dados da propria conta;
- listar documentos liberados;
- listar compromissos vinculados ao paciente.

### Notifications

Arquivo:

- `modules/notifications/notifications.routes.ts`

Responsavel por listar notificacoes do tenant/usuario.

### Settings

Arquivo:

- `modules/settings/settings.routes.ts`

Responsavel por expor e atualizar politicas institucionais do tenant:

- anos de retencao documental;
- anos de retencao de dados de saude;
- modo de descarte;
- janela de descarte;
- exigencia de consentimento para compartilhamento no portal.

### Assistant

Arquivos:

- `modules/assistant/assistant.routes.ts`
- `modules/assistant/assistant.service.ts`

Responsavel por:

- manter threads de conversa no banco;
- enviar contexto resumido de pacientes para o modelo;
- responder via OpenAI quando configurado;
- cair em modo fallback quando a API key nao estiver definida.

Guardrails atuais:

- nao grava automaticamente no banco;
- nao deve expor registro restrito sem confirmacao e PIN;
- deve manter linguagem tecnica e objetiva.

## Auditoria

Biblioteca:

- `apps/api/src/lib/audit.ts`

Eventos auditados incluem, entre outros:

- autenticacao;
- verificacao de PIN;
- criacao, edicao e exclusao de documentos;
- compartilhamento de documento;
- CRUD de registro restrito;
- gestao de contas do portal;
- atualizacao de politica institucional;
- exportacao de PDF.

## PDF

Arquivo:

- `apps/api/src/lib/pdf.ts`

Abordagem:

- gerador manual de PDF sem dependencia externa adicional;
- usa fontes base `Helvetica` e `Helvetica-Bold`;
- faz quebra simples de linha;
- suporta multipaginas.

Uso atual:

- exportacao de documentos clinicos pela equipe interna.

## Storage local

Arquivo:

- `apps/api/src/lib/storage.ts`

Comportamento atual:

- salva arquivos em `/tmp/lumnipsi-uploads`;
- expostos publicamente por `/storage/<arquivo>`;
- serve bem para ambiente local e MVP;
- para producao, o ideal e substituir por provedor objeto externo.

## Convencoes importantes

- toda query relevante deve filtrar por `tenantId`;
- validacao de entrada deve acontecer via Zod;
- respostas devem seguir o contrato `{ data }` / `{ error }`;
- rotas sensiveis devem registrar auditoria;
- nunca confiar no frontend para decidir seguranca.
