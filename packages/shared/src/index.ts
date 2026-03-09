export const appName = 'LumniPsi';

export const roles = [
  'OWNER',
  'ADMIN',
  'PROFESSIONAL',
  'RECEPTION',
  'INTERN',
  'READONLY',
  'PATIENT',
  'GUARDIAN',
] as const;

export type MembershipRole = (typeof roles)[number];

export const appointmentStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'NO_SHOW',
  'CANCELED',
  'RESCHEDULED',
  'BLOCKED',
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const quickFillLibrary = {
  patientDemand: [
    'Pessoa atendida busca acompanhamento psicológico por sintomas ansiosos com impacto funcional, incluindo inquietação, preocupação recorrente e alterações de sono.',
    'Responsáveis solicitam atendimento em razão de dificuldades comportamentais observadas em casa e no contexto escolar, com prejuízo na convivência.',
    'Pessoa atendida refere sofrimento relacionado a luto recente, com alterações emocionais, dificuldade de concentração e retraimento social.',
    'Demanda relacionada a conflitos conjugais e dificuldades de comunicação, com repercussões no humor e na organização da rotina.',
    'Atendimento solicitado em contexto institucional/judicial para acompanhamento psicológico e suporte durante o processo em curso.',
    'Pessoa atendida busca acolhimento em razão de sintomas depressivos, desmotivação, desesperança e perda de interesse em atividades habituais.',
    'Demanda voltada ao manejo de estresse ocupacional, exaustão emocional e sobrecarga laboral persistente.',
    'Busca por atendimento diante de queixas de autoestima, insegurança e padrões autocríticos intensos.',
    'Procura por acompanhamento no contexto de transições de vida, reorganização identitária e tomada de decisões relevantes.',
    'Solicitação de avaliação psicológica para investigar funcionamento emocional, cognitivo e comportamental em contexto delimitado.',
    'Busca por acompanhamento diante de conflitos familiares recorrentes, sensação de sobrecarga e dificuldade de mediação de limites.',
    'Pessoa atendida refere crises de pânico situacionais, medo antecipatório e evitação de contextos específicos.',
    'Demanda associada a processo de separação, reorganização da parentalidade e impacto emocional sobre a rotina.',
    'Solicitação de suporte psicológico em contexto de adoecimento crônico e adaptação às mudanças funcionais.',
    'Procura por atendimento após episódio traumático recente, com hipervigilância, revivescências e prejuízo do descanso.',
    'Demanda relacionada a sofrimento decorrente de violência psicológica e necessidade de fortalecimento de rede de proteção.',
    'Atendimento solicitado para orientação de responsáveis sobre desenvolvimento infantil, rotina e manejo emocional.',
    'Pessoa atendida busca acolhimento por dificuldades acadêmicas associadas a ansiedade de desempenho e autocrítica intensa.',
    'Demanda em contexto de avaliação pré-cirúrgica, com necessidade de investigação psicológica e elaboração de documento.'
  ],
  evolutionSummary: [
    'Pessoa atendida compareceu no horário agendado, apresentou-se colaborativa e com discurso coerente. Foram trabalhados conteúdos relacionados ao tema central da sessão, com observação de recursos de enfrentamento já disponíveis e pontos que ainda demandam elaboração.',
    'Sessão voltada ao acolhimento de sofrimento psíquico atual, com exploração de fatores precipitantes e manutenção do quadro. Observou-se maior capacidade de nomeação emocional em comparação aos encontros anteriores.',
    'Atendimento com foco em compreensão de padrões relacionais e repercussões emocionais. Houve boa adesão às intervenções propostas e construção conjunta de estratégias para o período entre sessões.',
    'Sessão destinada à escuta qualificada e organização de demandas emergentes. Pessoa atendida relatou aumento do estresse na semana, sendo realizadas intervenções de regulação emocional e psicoeducação pertinentes.',
    'Atendimento infantil realizado com mediação lúdica. Observou-se expressão afetiva compatível com o contexto apresentado e, ao final, foram oferecidas orientações breves aos responsáveis.',
    'Sessão com revisão de acontecimentos relevantes desde o último encontro e monitoramento da resposta às estratégias previamente combinadas.',
    'Atendimento marcado por maior introspecção e necessidade de sustentação do enquadre terapêutico, com foco em acolhimento e continuidade do vínculo.',
    'Sessão de devolutiva parcial, com comunicação técnica em linguagem acessível e alinhamento dos próximos passos do acompanhamento.',
    'Atendimento direcionado ao manejo de ansiedade situacional, com identificação de gatilhos, respostas fisiológicas e alternativas de enfrentamento.',
    'Sessão de acompanhamento em contexto de crise, com contenção, avaliação de risco e pactuação de rede de apoio quando pertinente.',
    'Pessoa atendida trouxe conflitos familiares recentes, com exploração do impacto subjetivo e construção de alternativas de manejo no contexto relacional.',
    'Atendimento voltado à elaboração de luto, com acolhimento do sofrimento, validação da experiência e observação do funcionamento atual.',
    'Sessão focada em revisão de metas terapêuticas, contratualidade e alinhamento de expectativas quanto ao processo em curso.',
    'Atendimento com maior possibilidade de reflexão sobre padrões autocríticos, culpa e exigência interna, com ampliação do repertório de auto-observação.',
    'Sessão dedicada à preparação para entrevista devolutiva/documento, com esclarecimento técnico em linguagem acessível e delimitação de finalidade.',
    'Atendimento realizado com presença de responsável, contemplando escuta clínica, observação da interação e orientação pontual sobre manejo.',
    'Sessão marcada por oscilação de humor e relato de eventos estressores recentes, com monitoramento clínico e reforço de estratégias protetivas.',
    'Atendimento breve para reorganização da continuidade do cuidado após interrupção temporária do acompanhamento.',
    'Sessão destinada à consolidação de ganhos terapêuticos percebidos e discussão sobre manutenção do plano de acompanhamento.'
  ],
  procedures: [
    'Escuta clínica qualificada, acolhimento e validação emocional.',
    'Psicoeducação sobre sintomas, fatores desencadeantes e estratégias de manejo.',
    'Técnicas cognitivo-comportamentais de identificação de pensamentos automáticos e reestruturação cognitiva.',
    'Intervenções de respiração diafragmática, relaxamento e grounding.',
    'Recursos lúdicos estruturados, observação clínica e devolutiva breve aos responsáveis.',
    'Entrevista clínica semiestruturada e levantamento de histórico relevante.',
    'Mapeamento de rede de apoio e planejamento de condutas para o intervalo entre sessões.',
    'Exploração de padrões de comunicação, limites e papéis relacionais.',
    'Avaliação clínica inicial com definição de foco terapêutico e enquadre.',
    'Discussão de estratégias de regulação emocional e resolução de problemas.',
    'Avaliação de fatores de risco e proteção, com pactuação de encaminhamentos quando necessários.',
    'Intervenções focadas em mentalização, nomeação de afetos e ampliação de repertório reflexivo.',
    'Exploração de crenças centrais, esquemas relacionais e respostas habituais ao estresse.',
    'Orientação a responsáveis sobre comunicação, rotina, previsibilidade e manejo de comportamento.',
    'Construção de linha do tempo de eventos significativos para contextualização clínica.',
    'Planejamento compartilhado de metas terapêuticas e critérios de acompanhamento.',
    'Devolutiva parcial sobre processo de avaliação psicológica, com tradução técnica acessível.',
    'Levantamento de recursos comunitários e institucionais úteis para a continuidade do cuidado.',
    'Registro de comparecimento, enquadre e pactuação de próximos passos do acompanhamento.'
  ],
  observations: [
    'Mantido acompanhamento psicológico, com monitoramento contínuo da demanda apresentada.',
    'Orientação breve fornecida à pessoa responsável, com reforço de combinados e manejo de rotina.',
    'Indicado acompanhamento multiprofissional complementar, a depender da evolução do caso.',
    'Registrada ausência em encontro previamente agendado, com possibilidade de reagendamento.',
    'Próxima sessão sugerida conforme periodicidade habitual do acompanhamento.',
    'Reforçada a importância da rede de apoio e dos cuidados de proteção em caso de agravamento do sofrimento.',
    'Anotadas informações contextuais relevantes para seguimento do plano terapêutico.',
    'Caso permanece em observação clínica quanto à intensidade e frequência dos sintomas relatados.',
    'Realizado alinhamento sobre limites do sigilo e objetivos do acompanhamento.',
    'Mantida atenção a fatores de risco e necessidade de reavaliação clínica quando pertinente.',
    'Documento ou devolutiva poderá ser elaborado(a) conforme solicitação formal e finalidade específica.',
    'Registrada necessidade de articulação com outros profissionais, preservado o sigilo e a finalidade do cuidado.',
    'Sugere-se reavaliação do plano terapêutico conforme resposta observada nas próximas sessões.',
    'Responsável orientado(a) quanto aos limites do acompanhamento e aos objetivos do serviço prestado.',
    'Pessoa atendida informou dificuldade de comparecimento em razão de fatores logísticos, sem interrupção formal do cuidado.',
    'Recomendado acompanhamento da adesão às estratégias combinadas entre sessões.',
    'Permanece indicada observação clínica quanto a sinais de agravamento, preservadas as medidas protetivas cabíveis.',
    'A entrevista devolutiva deverá ser registrada em momento oportuno, quando houver emissão de relatório ou laudo.',
    'Conteúdos mais sensíveis devem permanecer no registro documental reservado, e não no prontuário acessível.'
  ],
  documentPurposes: [
    'Comprovar comparecimento da pessoa atendida ao serviço psicológico em data e horário específicos.',
    'Informar conclusão técnica de avaliação psicológica para finalidade clínica delimitada.',
    'Subsidiar continuidade de cuidado em rede multiprofissional, com compartilhamento mínimo necessário.',
    'Atender solicitação formal da pessoa atendida ou responsável legal para fins extrajudiciais.',
    'Oferecer devolutiva documentada sobre processo de avaliação psicológica realizado em período delimitado.',
    'Registrar encaminhamento psicológico com objetivo claramente definido e linguagem técnica objetiva.',
    'Atender demanda institucional específica sem extrapolar a finalidade do documento emitido.',
    'Formalizar acompanhamento psicológico em curso, preservado o sigilo e a limitação de uso do documento.',
    'Comunicar necessidade de afastamento ou restrição por condição psicológica avaliada tecnicamente.',
    'Responder questão-problema por meio de parecer técnico fundamentado em referências científicas pertinentes.'
  ]
};

export const documentTypeLabels = {
  DECLARATION: 'Declaração',
  CERTIFICATE: 'Atestado psicológico',
  REPORT: 'Relatório psicológico',
  MULTIDISCIPLINARY_REPORT: 'Relatório multiprofissional',
  PSYCHOLOGICAL_EVALUATION: 'Laudo psicológico',
  OPINION: 'Parecer psicológico',
} as const;
