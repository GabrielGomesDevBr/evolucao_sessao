# Diretrizes CFP

## Objetivo

Este documento resume as diretrizes normativas que mais impactam o desenho do LumniPsi. O foco aqui nao e reproduzir integralmente as normas, mas traduzir os pontos que afetam produto, UX, seguranca, documentacao clinica e uso de IA.

## Fontes consideradas

- [Manual_Orientativo.pdf](../Manual_Orientativo.pdf)
- [Resolucao-do-exercicio-profissional-6-2019-Conselho-federal-de-psicologia-BR.pdf](../Resolucao-do-exercicio-profissional-6-2019-Conselho-federal-de-psicologia-BR.pdf)

## Como usar este documento

Este arquivo deve ser lido junto com:

- [backend.md](./backend.md)
- [database.md](./database.md)
- [auth-and-security.md](./auth-and-security.md)
- [frontend.md](./frontend.md)

## Principios gerais

- toda comunicacao escrita decorrente do exercicio profissional deve seguir criterios eticos, tecnicos e cientificos;
- o documento psicologico e instrumento de comunicacao escrita resultante da prestacao de servico psicologico;
- o conteudo deve conter dados fidedignos, com base em avaliacao e ou intervencao psicologica;
- o fenomeno psicologico deve ser tratado como dinamico, nao definitivo e nao cristalizado;
- a aplicacao deve favorecer linguagem precisa, objetiva, tecnica e respeitosa aos direitos humanos.

## Linguagem e escrita

- a redacao deve ser preferencialmente formal, objetiva e coerente;
- a escrita deve evitar excessos interpretativos sem fundamentacao;
- documentos psicologicos devem ser redigidos de forma impessoal, preferencialmente em terceira pessoa;
- nao se deve reproduzir transcricao literal de atendimentos, salvo quando houver justificativa tecnica clara;
- quick fills, placeholders e textos produzidos por IA devem incentivar sintese tecnica, e nao relato bruto da sessao.

## Separacao entre prontuario e registro documental

- prontuario psicologico e registro documental nao possuem o mesmo regime de acesso;
- o prontuario e mais compativel com contextos de saude e assistencia, podendo seguir regras de acesso do usuario beneficiario;
- o registro documental resguarda material tecnico reservado, com acesso restrito;
- a aplicacao deve manter essas estruturas separadas em dados, interface, permissao e auditoria;
- o registro documental nao pode ser exposto em portal de pacientes ou responsaveis.

## Sigilo e controle de acesso

- o sigilo profissional e eixo central da pratica e deve orientar a arquitetura do sistema;
- o acesso a conteudos sensiveis deve ser restrito ao estritamente necessario;
- em contexto multiprofissional, registrar apenas o indispensavel ao trabalho conjunto;
- o sistema deve registrar quem acessou, exportou, compartilhou ou modificou conteudos sigilosos;
- para areas restritas, recomenda-se autenticacao adicional.

No LumniPsi, essa recomendacao foi traduzida em:

- autenticacao principal por JWT;
- RBAC por papel;
- PIN secundario para a area de registros restritos;
- auditoria de eventos criticos.

## Modalidades documentais suportadas

O sistema foi modelado para suportar:

- declaracao;
- atestado psicologico;
- relatorio psicologico;
- relatorio multiprofissional;
- laudo psicologico;
- parecer psicologico.

Esses tipos estao refletidos no enum `DocumentType` e na camada de labels do frontend.

## Regras de uso por tipo documental

- declaracao: informar dados pontuais, como comparecimento ou acompanhamento; nao substituir atestado ou laudo;
- atestado psicologico: comunicar conclusao tecnica sobre condicao psicologica; exige fundamento em avaliacao psicologica e registro documental;
- relatorio psicologico: descrever trabalho realizado, evolucao e encaminhamentos; nao corresponde a descricao literal das sessoes;
- relatorio multiprofissional: comunicar atuacao em equipe, preservando praticas privativas e sigilo profissional;
- laudo psicologico: produto de avaliacao psicologica, com procedimento, analise e conclusao sustentados tecnicamente;
- parecer psicologico: resposta tecnica sobre questao-problema ou documento; nao e resultado de avaliacao psicologica do atendido.

## Entrevista devolutiva

- para relatorio e laudo psicologico, deve haver ao menos uma entrevista devolutiva a pessoa, grupo, instituicao atendida ou responsaveis legais;
- caso isso nao seja possivel, as razoes devem ser registradas no prontuario ou registro documental;
- o produto deve prever marcacao de devolutiva, data, responsavel e status.

Estado atual do produto:

- a regra ja orienta os textos e a modelagem documental;
- o campo `requiresReturnInterview` existe em `Document`;
- ainda ha espaco para expandir a UX especifica de controle formal de devolutiva.

## Guarda e retencao

- registros e documentos psicologicos devem ser guardados por prazo minimo de 5 anos;
- em contextos de saude, prontuarios podem exigir guarda de ate 20 anos, conforme legislacao aplicavel;
- o sistema deve permitir politica de retencao parametrizavel e descarte seguro ao final do prazo legal;
- o descarte deve inviabilizar o acesso por terceiros.

Estado atual do produto:

- `Tenant.recordRetentionYears`
- `Tenant.healthDataRetentionYears`
- `Tenant.disposalMode`
- `Tenant.disposalWindowDays`
- `Tenant.requireDocumentShareConsent`

## Atendimento multiprofissional, grupo e contextos especiais

- em prontuario multiprofissional, registrar apenas o indispensavel aos objetivos do cuidado;
- em atendimentos em grupo, a estrutura minima continua necessaria, com informacoes relevantes sobre funcionamento do grupo;
- casos envolvendo justica, criancas e adolescentes, violencia ou populacoes especificas demandam cautela reforcada com sigilo e finalidade.

## IA e apoio automatizado

- o uso de IA e apoio, nao substituicao da responsabilidade tecnica da psicologa ou do psicologo;
- a IA pode auxiliar organizacao, padronizacao e rascunhos, desde que haja revisao humana;
- nao se deve inserir ou expor indevidamente informacoes sensiveis em sistemas automatizados;
- o assistente do produto deve operar com guardrails, sem gravacao automatica, com confirmacao humana e com respeito ao PIN secundario nas areas sensiveis.

No estado atual do LumniPsi:

- o assistente registra thread e mensagens;
- usa contexto resumido do tenant;
- nao grava automaticamente em prontuario ou registro restrito;
- cai em modo fallback quando a API da OpenAI nao esta configurada.

## Requisitos praticos ja refletidos no produto

- separacao entre prontuario acessivel e registro documental reservado;
- portal externo apenas para documentos explicitamente liberados;
- quick fills e IA orientados a sintese tecnica e impessoal;
- auditoria de acoes criticas;
- controle de papeis e multi-tenant;
- preparacao para retencao e descarte conforme regra institucional.

## Pontos de atencao futuros

- ajustar politica de retencao por tipo de servico e enquadramento legal da clinica;
- validar fluxos de acesso para pacientes, responsaveis e instituicoes conforme caso concreto;
- definir processo formal de revogacao, exportacao e descarte de dados;
- incluir consentimentos e termos especificos para compartilhamento em portal;
- revisar continuamente textos rapidos e prompts do assistente a luz de novas normativas do CFP.
