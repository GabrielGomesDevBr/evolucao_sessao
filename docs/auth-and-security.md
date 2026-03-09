# Autenticacao e Seguranca

## Visao geral

O sistema usa quatro tipos de credencial para separar contextos de acesso:

1. `access token`
2. `refresh token`
3. `portal token`
4. `pin token`

Cada um resolve um problema diferente.

## 1. Access token

Uso:

- autenticar o usuario interno nas rotas da area administrativa e clinica.

Geracao:

- `signAccessToken` em `apps/api/src/lib/auth.ts`

Validade:

- `1h`

Payload:

- `sub`
- `tenantId`
- `role`
- `email`

Leitura:

- `requireAuth`

## 2. Refresh token

Uso:

- renovar a sessao web sem exigir novo login.

Geracao:

- `signRefreshToken`

Validade:

- `14d`

Escopo:

- `scope: "refresh"`

Fluxo:

1. login retorna `token` + `refreshToken`;
2. frontend salva ambos em `localStorage`;
3. `AuthProvider` agenda renovacao antes da expiracao;
4. `POST /auth/refresh` devolve novo par de tokens;
5. se a renovacao falhar, a sessao e descartada.

## 3. Portal token

Uso:

- autenticar paciente ou responsavel no portal externo.

Geracao:

- `signPortalToken`

Validade:

- `8h`

Escopo:

- `scope: "portal"`

Diferenca para o access token:

- o portal nao recebe os mesmos acessos da area interna;
- o payload inclui `patientId`.

## 4. PIN token

Uso:

- liberar temporariamente a area de registros restritos.

Geracao:

- `signPinToken`

Validade:

- `15m`

Escopo:

- `scope: "pin"`

Leitura:

- middleware `requirePin`

Regra importante:

- o `pinToken` precisa pertencer ao mesmo `sub` e `tenantId` da sessao autenticada;
- isso impede reaproveitamento entre usuarios.

## Senhas e hashes

Biblioteca:

- `bcryptjs`

Usos:

- `passwordHash` para usuarios internos;
- `passwordHash` para contas do portal;
- `pinHash` para PIN secundario.

Nenhuma senha ou PIN e gravado em texto puro.

## RBAC

Papeis existentes:

- `OWNER`
- `ADMIN`
- `PROFESSIONAL`
- `RECEPTION`
- `INTERN`
- `READONLY`
- `PATIENT`
- `GUARDIAN`

Uso atual na API:

- modulos clinicos restringem a equipe clinica;
- modulos operacionais aceitam recepcao;
- configuracoes institucionais aceitam apenas `OWNER` e `ADMIN`.

## Auditoria

A tabela `AuditLog` e parte da arquitetura de seguranca.

Eventos relevantes auditados:

- autenticacao;
- refresh de sessao;
- verificacao de PIN;
- criacao e alteracao de politica institucional;
- compartilhamento e exportacao de documentos;
- CRUD de registros restritos;
- criacao, revogacao, reativacao, edicao e reset de senha do portal.

## Compartilhamento de documentos

Campo de controle:

- `Document.shareWithPortal`

Politica institucional:

- `Tenant.requireDocumentShareConsent`

Estado atual:

- a politica institucional existe e pode ser configurada;
- a regra esta registrada no banco e administrada pela UI;
- o enforcement fino de processo e consentimento documental pode evoluir mais em fases futuras.

## Storage de assinatura

Estado atual:

- arquivos salvos em `/tmp/lumnipsi-uploads`;
- publicados por `/storage`.

Risco conhecido:

- apropriado para desenvolvimento e MVP;
- para producao, o ideal e mover para armazenamento externo com controle de acesso, expurgo e backup.

## Assistente com IA

Guardrails implementados em `assistant.service.ts`:

- nao gravar dados automaticamente no banco;
- nao expor registro restrito sem confirmacao e PIN;
- priorizar linguagem tecnica, objetiva e alinhada ao contexto clinico.

Comportamento quando nao ha API key:

- responde em modo fallback, sem quebrar a interface.

## CORS

Controle atual:

- origens locais conhecidas;
- `APP_URL`;
- IPs privados em redes locais.

Isso facilita desenvolvimento em dispositivos da mesma rede.

## Limites e pontos de atencao

Apesar do MVP estar endurecido comparado ao inicio do projeto, ainda vale observar:

- `localStorage` continua sendo o mecanismo de persistencia da sessao no frontend;
- nao ha rotacao server-side ou blacklist persistente de refresh tokens;
- o portal ainda nao tem fluxo de "esqueci minha senha";
- o portal externo ainda nao baixa PDF formal, apenas versao textual simples;
- storage local de arquivos nao e ideal para ambiente multi-instancia.
