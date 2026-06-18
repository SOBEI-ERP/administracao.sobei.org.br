// ============================================
// SOBEI Portal — Constantes de Navegação e Status
// ============================================

/**
 * Links do menu de denúncias (Sidebar + MobileHeader).
 * Fonte única de verdade — edite aqui para refletir em toda a navegação.
 */
export const DENUNCIA_LINKS = [
  { href: '/admin/fila', label: 'Na fila' },
  { href: '/admin/andamento', label: 'Em andamento' },
  { href: '/admin/fechadas', label: 'Fechadas' },
  { href: '/admin/arquivadas', label: 'Arquivadas' },
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
export const FILTROS_INICIAIS = { tipo: '', unidade: '', ordem: 'antigos', prioridadeOrdem: '', protocolo: '', dataInicio: '', dataFim: '' };
