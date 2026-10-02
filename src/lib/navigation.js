// ============================================
// SOBEI Portal — Constantes de Navegação e Status
// ============================================

/**
 * Links do menu de denúncias (Sidebar + MobileHeader).
 * Fonte única de verdade — edite aqui para refletir em toda a navegação.
 */
export const DENUNCIA_LINKS = [
  { href: '/fila', label: 'Na fila', status: 'na_fila' },
  { href: '/andamento', label: 'Em andamento', status: 'em_andamento' },
  { href: '/fechadas', label: 'Fechadas', status: 'fechada' },
  { href: '/arquivadas', label: 'Arquivadas', status: 'arquivada' },
];

/**
 * Configuração por status: título da página e mensagem de lista vazia.
 */
export const STATUS_CONFIG = {
  na_fila: {
    titulo: 'Denúncias na fila',
    mensagemVazia: 'Nenhuma denúncia na fila.',
  },
  em_andamento: {
    titulo: 'Denúncias em andamento',
    mensagemVazia: 'Nenhuma denúncia em andamento.',
  },
  fechada: {
    titulo: 'Denúncias fechadas',
    mensagemVazia: 'Nenhuma denúncia fechada.',
  },
  arquivada: {
    titulo: 'Denúncias arquivadas',
    mensagemVazia: 'Nenhuma denúncia arquivada.',
  },
};

/**
 * Estado inicial dos filtros de listagem de denúncias.
 */
export const FILTROS_INICIAIS = { tipo: '', unidade: '', ordem: 'antigos', protocolo: '', dataInicio: '', dataFim: '' };
