# Frontend

## Stack

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- PWA via `vite-plugin-pwa`

## Ponto de entrada

Arquivo:

- `apps/web/src/main.tsx`

Responsabilidades:

- criar `QueryClient`;
- montar providers globais;
- iniciar `BrowserRouter`;
- renderizar `AppRouter`.

## Estrutura do frontend

```text
apps/web/src/
|-- app/
|   |-- router.tsx
|   `-- state/
|       |-- app-state.tsx
|       |-- auth-state.tsx
|       `-- feedback-state.tsx
|-- components/
|   |-- shell.tsx
|   |-- sidebar.tsx
|   |-- topbar.tsx
|   `-- card.tsx
|-- features/
|   |-- assistant/
|   |-- auth/
|   |-- calendar/
|   |-- dashboard/
|   |-- documents/
|   |-- evolution/
|   |-- patients/
|   |-- portal/
|   |-- records/
|   `-- settings/
|-- lib/
|   |-- api.ts
|   |-- app-types.ts
|   `-- utils.ts
`-- styles/
    `-- index.css
```

## Roteamento

Arquivo:

- `apps/web/src/app/router.tsx`

Rotas publicas:

- `/login`
- `/portal/acesso`

Rotas protegidas:

- `/`
- `/agenda`
- `/evolucao`
- `/pacientes`
- `/documentos`
- `/sigilo`
- `/assistente`
- `/configuracoes`
- `/portal`

## Layout protegido

O componente `ProtectedLayout`:

- espera `isLoading` da sessao;
- redireciona para `/login` se nao houver sessao;
- renderiza `Shell` quando a autenticacao esta pronta.

## Providers do estado

### `AuthProvider`

Responsavel por:

- login;
- logout;
- restaurar sessao do `localStorage`;
- renovar token automaticamente com `refreshToken`;
- expor usuario, papel e tenant atual.

Persistencia:

- chave atual: `lumnipsi-auth`

Dados persistidos:

- `token`
- `refreshToken`
- `user`
- `role`
- `tenantId`

### `AppStateProvider`

Responsavel por:

- manter as colecoes principais em memoria;
- buscar dados da API apos autenticacao;
- executar CRUD via chamadas HTTP;
- controlar o paciente selecionado;
- controlar estado de PIN verificado;
- concentrar operacoes de assistente e assinatura.

Colecoes em memoria:

- pacientes
- appointments
- evolutions
- documents
- restrictedRecords
- professional

### `FeedbackProvider`

Responsavel por:

- exibir mensagens de sucesso, erro e informacao;
- autoclose em 3.5 segundos;
- renderizar avisos no canto superior da `Shell`.

## Camada HTTP

Arquivo:

- `apps/web/src/lib/api.ts`

Comportamento:

- monta a URL base usando `VITE_API_URL` ou `http://<host>:3333`;
- envia `Authorization` quando ha token;
- envia `x-pin-token` quando ha PIN valido;
- espera contrato `{ data }` da API;
- transforma erros da API em `Error` com `status`.

## Shell da aplicacao

### `Shell`

Responsavel por:

- layout principal da area autenticada;
- sidebar;
- topbar;
- banner de instalacao PWA;
- toasts de feedback;
- indicador de sincronizacao.

### `Topbar`

Funcionalidades:

- busca local entre pacientes, agenda e documentos carregados;
- fetch de notificacoes da API;
- indicador de notificacoes;
- identificacao do profissional logado;
- logout.

Observacao:

- a busca atual e client-side, sem endpoint proprio de busca.

## Telas principais

### `LoginPage`

- login interno da equipe;
- consome `AuthProvider`.

### `DashboardPage`

- visao geral operacional do workspace;
- usa dados ja carregados no `AppStateProvider`.

### `PatientsPage`

- CRUD de pacientes;
- formulario ampliado para os principais campos do schema;
- define paciente selecionado usado em outras telas.

### `CalendarPage`

- agenda editavel;
- CRUD de compromissos e bloqueios;
- usa dados reais do backend.

### `EvolutionPage`

- CRUD de evolucoes;
- usa o paciente em foco para acelerar preenchimento.

### `RecordsPage`

- area de sigilo reforcado;
- depende de PIN valido;
- CRUD de registros restritos.

### `DocumentsPage`

- CRUD de documentos;
- compartilhamento com portal;
- exportacao de PDF via backend.

### `PortalPage`

- tela administrativa das contas do portal;
- cria conta;
- edita conta;
- revoga ou reativa acesso;
- redefine senha;
- mostra pre-visualizacao do que esta compartilhado.

### `PortalAccessPage`

- interface separada do portal externo;
- login do paciente/responsavel;
- lista documentos e agendamentos liberados.

Observacao importante:

- hoje o portal externo faz download textual simples do documento;
- o PDF formal esta implementado para a area interna.

### `SettingsPage`

- perfil profissional;
- upload de assinatura;
- politicas institucionais de retencao e descarte.

### `AssistantPage`

- conversa com o assistente;
- envia mensagem e recebe resposta com `threadId`.

## Tipos de dominio do frontend

Arquivo:

- `apps/web/src/lib/app-types.ts`

Define tipos enxutos para:

- `Patient`
- `Appointment`
- `Evolution`
- `GeneratedDocument`
- `RestrictedRecord`

Esses tipos sao a forma normalizada consumida pela UI.

## Normalizacao de dados

O `AppStateProvider` faz a traducao entre payload da API e formato da UI:

- converte `shareWithPortal` em `shared`;
- converte `colorToken` em classes CSS como `bg-lagoon`;
- preenche strings opcionais vazias para simplificar formularios;
- controla `selectedPatient` por id.

## PWA

Arquivo:

- `apps/web/vite.config.ts`

Configuracao atual:

- `registerType: 'prompt'`
- `display: 'standalone'`
- nome da app: `LumniPsi`
- assets de icone `icon-192.png` e `icon-512.png`

## Convencoes importantes

- CRUD principal deve passar pelo `AppStateProvider`;
- erros de API devem ser refletidos com `notify('error', ...)`;
- mensagens de sucesso devem ser explicitamente exibidas;
- a UI assume que o backend filtra por tenant e permissao;
- PIN nao fica persistido em disco; ele fica em memoria na sessao atual.
