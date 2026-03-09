# API Reference

Esta referencia descreve os endpoints atuais da API. Os payloads abaixo resumem o contrato esperado, nao necessariamente cada campo opcional.

## Convencoes gerais

- base local padrao: `http://localhost:3333`
- healthcheck: `GET /health`
- sucesso: `{ data: ... }`
- erro: `{ error: "mensagem" }`
- autenticacao interna: `Authorization: Bearer <token>`
- PIN secundario: `x-pin-token: <pinToken>`

## Health

### `GET /health`

Retorna:

```json
{
  "status": "ok",
  "name": "LumniPsi API"
}
```

## Auth

### `POST /auth/register`

Cria:

- tenant
- owner
- membership owner
- professional profile inicial

Body:

```json
{
  "tenantName": "Clinica Exemplo",
  "tenantSlug": "clinica-exemplo",
  "firstName": "Ana",
  "lastName": "Silva",
  "email": "ana@example.com",
  "password": "Senha@123",
  "licenseCode": "CRP-00/123456"
}
```

### `POST /auth/login`

Body:

```json
{
  "email": "demo@lumnipsi.app",
  "password": "LumniPsi@123"
}
```

Resposta:

- `token`
- `refreshToken`
- `expiresInMinutes`
- `tenantId`
- `role`
- `user`

### `POST /auth/refresh`

Body:

```json
{
  "refreshToken": "..."
}
```

### `POST /auth/pin`

Protecao:

- requer `Authorization`

Body:

```json
{
  "pin": "4321"
}
```

Resposta:

- `verified`
- `pinToken`
- `expiresInMinutes`

### `POST /auth/pin/setup`

Protecao:

- requer `Authorization`

Body:

```json
{
  "pin": "4321"
}
```

## Patients

Protecao:

- `Authorization`
- papeis operacionais

### `GET /patients`

Lista pacientes do tenant.

### `POST /patients`

Campos principais:

```json
{
  "fullName": "Helena Duarte",
  "socialName": "Helena",
  "birthDate": "1992-08-21T00:00:00.000Z",
  "cpf": "12345678900",
  "gender": "Feminino",
  "phone": "(11) 99999-0000",
  "email": "helena@example.com",
  "demandSummary": "Resumo da demanda",
  "careModality": "Psicoterapia individual",
  "careFrequency": "Semanal",
  "treatmentGoals": "Objetivos do cuidado",
  "allowPortalAccess": true
}
```

### `PUT /patients/:id`

Mesmo payload do `POST`.

### `DELETE /patients/:id`

## Calendar

Protecao:

- `Authorization`
- papeis operacionais

### `GET /calendar`

### `POST /calendar`

```json
{
  "patientId": "optional",
  "title": "Sessao individual",
  "startsAt": "2026-03-10T12:00:00.000Z",
  "endsAt": "2026-03-10T12:50:00.000Z",
  "status": "CONFIRMED",
  "colorToken": "lagoon",
  "internalNotes": "Observacoes internas"
}
```

### `PUT /calendar/:id`

### `DELETE /calendar/:id`

## Sessions

Protecao:

- `Authorization`
- papeis clinicos

### `GET /sessions`

### `POST /sessions`

```json
{
  "patientId": "patient_id",
  "serviceDate": "2026-03-10T12:00:00.000Z",
  "sessionNumber": 12,
  "durationMinutes": 50,
  "summary": "Resumo clinico",
  "procedures": "Procedimentos realizados",
  "observations": "Observacoes",
  "format": "IN_PERSON"
}
```

### `PUT /sessions/:id`

### `DELETE /sessions/:id`

## Restricted Records

Protecao:

- `Authorization`
- `x-pin-token`
- papeis clinicos

### `GET /records`

### `POST /records`

```json
{
  "patientId": "patient_id",
  "recordDate": "2026-03-10T12:00:00.000Z",
  "category": "Hipotese diagnostica",
  "content": "Conteudo reservado",
  "sensitivity": "HIGH"
}
```

### `PUT /records/:id`

### `DELETE /records/:id`

## Documents

Protecao:

- `Authorization`
- papeis clinicos

### `GET /documents`

### `GET /documents/:id/pdf`

Retorna:

- `Content-Type: application/pdf`
- arquivo baixavel

### `POST /documents`

```json
{
  "patientId": "patient_id",
  "type": "REPORT",
  "requester": "optional",
  "purpose": "Finalidade do documento",
  "content": "Conteudo do documento",
  "validityText": "optional",
  "shareWithPortal": false,
  "requiresReturnInterview": true
}
```

### `PUT /documents/:id`

### `DELETE /documents/:id`

## Uploads

Protecao:

- `Authorization`

### `POST /uploads/metadata`

Registra metadados de upload.

### `POST /uploads/signature`

Upload real de assinatura profissional.

Body:

```json
{
  "fileName": "assinatura.png",
  "mimeType": "image/png",
  "base64Data": "data:image/png;base64,..."
}
```

## Professional

Protecao:

- `Authorization`
- papeis operacionais

### `GET /professional/me`

### `PUT /professional/me`

```json
{
  "licenseCode": "CRP-00/123456",
  "specialty": "Psicologia clinica",
  "city": "Sao Paulo",
  "state": "SP",
  "phone": "(11) 99999-0000"
}
```

### `PUT /professional/me/signature`

```json
{
  "signatureAssetId": "asset_id"
}
```

## Notifications

Protecao:

- `Authorization`

### `GET /notifications`

Lista notificacoes do contexto atual.

## Settings

Protecao:

- `Authorization`
- `OWNER` ou `ADMIN`

### `GET /settings/tenant`

### `PUT /settings/tenant`

```json
{
  "recordRetentionYears": 5,
  "healthDataRetentionYears": 20,
  "disposalMode": "ANONYMIZE",
  "disposalWindowDays": 30,
  "requireDocumentShareConsent": true
}
```

## Assistant

Protecao:

- `Authorization`
- papeis clinicos

### `POST /assistant/chat`

```json
{
  "message": "Gere um rascunho de evolucao",
  "threadId": "optional"
}
```

Resposta:

```json
{
  "threadId": "thread_id",
  "response": "texto gerado"
}
```

## Portal publico

### `POST /portal/auth/login`

Body:

```json
{
  "email": "portal.helena@example.com",
  "password": "Portal@123"
}
```

Resposta:

- `token`
- `account`

### `GET /portal/me`

Protecao:

- token do portal

### `GET /portal/me/documents`

Protecao:

- token do portal

Retorna apenas documentos com `shareWithPortal = true`.

### `GET /portal/me/appointments`

Protecao:

- token do portal

## Portal interno

Protecao:

- `Authorization`
- papeis operacionais

### `GET /portal/accounts`

### `POST /portal/accounts`

```json
{
  "patientId": "patient_id",
  "email": "novo.portal@example.com",
  "displayName": "Nome exibicao",
  "password": "Portal@123",
  "role": "PATIENT"
}
```

### `PATCH /portal/accounts/:id`

```json
{
  "email": "ajustado.portal@example.com",
  "displayName": "Nome atualizado",
  "role": "GUARDIAN"
}
```

### `PATCH /portal/accounts/:id/revoke`

```json
{
  "reason": "Acesso revogado pela equipe responsavel."
}
```

### `PATCH /portal/accounts/:id/reactivate`

Sem body.

### `POST /portal/accounts/:id/reset-password`

```json
{
  "password": "NovaSenha@123"
}
```

### `GET /portal/documents/:patientId`

Retorna documentos compartilhados daquele paciente.
