# Checklist MVP LumniPsi

Status geral em 2026-03-09: beta interno funcional, com backend e frontend integrados em boa parte dos fluxos, ainda com lacunas de segurança, acabamento operacional e fechamento de escopo.

## 1. Essencial para fechar o MVP

- [x] Substituir o PIN de cabeçalho livre por verificação server-side com token temporário.
- [x] Aplicar auditoria nos eventos críticos: login, PIN, CRUD de registro restrito, documentos compartilhados no portal.
- [x] Fechar RBAC mínimo por papel para áreas administrativas e sensíveis.
- [x] Tornar a agenda realmente editável no frontend, sem grade fake.
- [x] Permitir editar documentos no frontend, além de criar/excluir.
- [x] Implementar upload real de assinatura profissional, em vez de apenas salvar metadados.

## 2. Importante para operação real

- [x] Atualizar dashboard e demais textos que ainda descrevem a aplicação como demo/local-only.
- [x] Completar o formulário de pacientes com os campos principais do schema.
- [x] Expor notificações reais no topo.
- [x] Implementar busca básica por paciente/agenda/documento.
- [x] Melhorar o fluxo do portal: carregar contas com feedback, criar conta com atualização de tela e base mais consistente.
- [x] Mostrar e preservar melhor o estado de PIN verificado na UI.

## 3. Importante para consistência técnica

- [x] Remover sinais residuais de mock/protótipo do código principal.
- [x] Criar smoke tests mínimos de API para os fluxos críticos.
- [x] Ligar `lint` real no monorepo.
- [x] Revisar mensagens de erro e feedback de sucesso.

## 4. Pós-MVP / produção

- [x] Refresh token e endurecimento da sessão web.
- [x] Política institucional de retenção, descarte e revogação.
- [x] Exportação formal de documentos em PDF.
- [x] Gestão avançada de contas do portal.
- [x] Testes automatizados mais amplos.

## Ordem de execução adotada

1. Segurança e acesso.
2. Fluxos essenciais de operação.
3. Acabamento funcional da interface.
4. Verificações automatizadas mínimas.
