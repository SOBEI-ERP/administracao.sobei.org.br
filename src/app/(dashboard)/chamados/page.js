'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchChamados, criarChamado, atualizarChamado, deletarChamado } from '@/lib/api';
import CustomSelect from '@/components/admin/CustomSelect';
import { IconClock, IconTrash, IconClose, IconWarning, IconPlus } from '@/components/Icons';

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_informacao', label: 'Aguardando Informação' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export default function ChamadosPage() {
  const { user } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create Form State
  const [newTitulo, setNewTitulo] = useState('');
  const [newSolicitante, setNewSolicitante] = useState('');
  const [newPrioridade, setNewPrioridade] = useState('media');
  const [newPrazoConclusao, setNewPrazoConclusao] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newPlanoAcao, setNewPlanoAcao] = useState('');

  // Update State inside Detail Modal
  const [editStatus, setEditStatus] = useState('');
  const [editResolucao, setEditResolucao] = useState('');
  const [editPlanoAcao, setEditPlanoAcao] = useState('');

  const isSuporte = user?.nivel?.toLowerCase() === 'suporte';

  const loadChamados = useCallback(async () => {
    if (!isSuporte) return;
    setLoading(true);
    const data = await fetchChamados(statusFilter, prioridadeFilter);
    setChamados(data);
    setLoading(false);
  }, [isSuporte, statusFilter, prioridadeFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active && isSuporte) {
        loadChamados();
      }
    });
    return () => {
      active = false;
    };
  }, [loadChamados, isSuporte]);

  if (!isSuporte) {
    return (
      <div style={{ padding: 'var(--spacing-2xl) var(--spacing-base)', textAlign: 'center' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-2xl)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <IconWarning size={48} style={{ color: 'var(--color-red)', marginBottom: 'var(--spacing-md)' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', marginBottom: 'var(--spacing-xs)' }}>Acesso Restrito</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            A página de <strong>Chamados de Suporte</strong> é de acesso exclusivo para usuários com perfil de <strong>Suporte</strong>.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setNewTitulo('');
    setNewSolicitante('');
    setNewPrioridade('media');
    setNewPrazoConclusao('');
    setNewDescricao('');
    setNewPlanoAcao('');
    setErrorMessage('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newTitulo.trim() || !newSolicitante.trim() || !newDescricao.trim()) {
      setErrorMessage('Preencha os campos obrigatórios (*)');
      return;
    }

    setSubmitting(true);
    const result = await criarChamado({
      titulo: newTitulo.trim(),
      solicitante: newSolicitante.trim(),
      prioridade: newPrioridade,
      prazoConclusao: newPrazoConclusao || null,
      descricao: newDescricao.trim(),
      planoAcao: newPlanoAcao.trim() || null,
      criadoPor: user?.usuario || 'Suporte'
    });

    setSubmitting(false);

    if (result.success) {
      setShowCreateModal(false);
      loadChamados();
    } else {
      setErrorMessage(result.error || 'Erro ao criar chamado');
    }
  };

  const handleOpenDetail = (chamado) => {
    setSelectedChamado(chamado);
    setEditStatus(chamado.status);
    setEditResolucao(chamado.resolucao || '');
    setEditPlanoAcao(chamado.planoAcao || '');
    setErrorMessage('');
    setShowDetailModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChamado) return;
    setErrorMessage('');

    if ((editStatus === 'concluido' || editStatus === 'cancelado') && !editResolucao.trim()) {
      setErrorMessage('Por favor, informe a descrição de encerramento/resolução ao concluir ou cancelar.');
      return;
    }

    setSubmitting(true);
    const result = await atualizarChamado(selectedChamado.id, {
      status: editStatus,
      resolucao: editResolucao.trim() || null,
      planoAcao: editPlanoAcao.trim() || null
    });
    setSubmitting(false);

    if (result.success) {
      setShowDetailModal(false);
      loadChamados();
    } else {
      setErrorMessage(result.error || 'Erro ao atualizar chamado');
    }
  };

  const handleOpenDelete = (e, chamadoId) => {
    e.stopPropagation();
    setDeletingId(chamadoId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const result = await deletarChamado(deletingId);
    setDeleting(false);
    setShowDeleteModal(false);
    setDeletingId(null);
    if (showDetailModal) {
      setShowDetailModal(false);
    }
    if (result.success) {
      loadChamados();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '—';
    return new Date(dateTimeStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'aberto':
        return { label: 'Aberto', bg: 'rgba(27, 20, 100, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(27, 20, 100, 0.2)' };
      case 'em_andamento':
        return { label: 'Em Andamento', bg: 'rgba(124, 58, 237, 0.12)', color: 'var(--color-purple)', border: '1px solid rgba(124, 58, 237, 0.25)' };
      case 'aguardando_informacao':
        return { label: 'Aguardando Informação', bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-orange)', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'concluido':
        return { label: 'Concluído', bg: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green)', border: '1px solid rgba(22, 163, 74, 0.25)' };
      case 'cancelado':
        return { label: 'Cancelado', bg: 'var(--color-gray-100)', color: 'var(--color-gray-600)', border: '1px solid var(--color-gray-300)' };
      default:
        return { label: status, bg: 'var(--color-gray-100)', color: 'var(--color-gray-700)', border: '1px solid var(--color-gray-300)' };
    }
  };

  const getPrioridadeBadgeClass = (prioridade) => {
    switch (prioridade) {
      case 'baixa':
        return 'priority-badge priority-badge--baixa';
      case 'media':
        return 'priority-badge priority-badge--media';
      case 'alta':
        return 'priority-badge priority-badge--alta';
      case 'urgente':
        return 'priority-badge priority-badge--urgente';
      default:
        return 'priority-badge priority-badge--neutra';
    }
  };

  const totalCount = chamados.length;
  const abertosCount = chamados.filter((c) => c.status === 'aberto').length;
  const emAndamentoCount = chamados.filter((c) => c.status === 'em_andamento' || c.status === 'aguardando_informacao').length;
  const concluidosCount = chamados.filter((c) => c.status === 'concluido').length;

  return (
    <div className="vagas-admin">
      {/* Header */}
      <div className="vagas-admin__header">
        <div>
          <h1 className="vagas-admin__title">Chamados de Suporte</h1>
          <p className="vagas-admin__subtitle">
            Gestão interna de solicitações técnicas, prazos e soluções <strong>(Exclusivo Suporte)</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn btn--blue"
          onClick={handleOpenCreate}
        >
          <IconPlus size={18} /> Novo Chamado
        </button>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-base)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Chamados</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', margin: 'var(--spacing-xs) 0 0 0' }}>{totalCount}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abertos</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', margin: 'var(--spacing-xs) 0 0 0' }}>{abertosCount}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Em Andamento</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-purple)', margin: 'var(--spacing-xs) 0 0 0' }}>{emAndamentoCount}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concluídos</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', margin: 'var(--spacing-xs) 0 0 0' }}>{concluidosCount}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap', padding: 0, marginBottom: 'var(--spacing-xl)' }}>
        <div className="filter-bar__group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-sm)', minWidth: '220px' }}>
          <span className="filter-bar__label" style={{ marginBottom: 0 }}>Status:</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            defaultOption="Todos os Status"
            style={{ minWidth: '180px', flex: 1 }}
          />
        </div>
        <div className="filter-bar__group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-sm)', minWidth: '220px' }}>
          <span className="filter-bar__label" style={{ marginBottom: 0 }}>Prioridade:</span>
          <CustomSelect
            value={prioridadeFilter}
            onChange={setPrioridadeFilter}
            options={PRIORIDADE_OPTIONS}
            defaultOption="Todas as Prioridades"
            style={{ minWidth: '180px', flex: 1 }}
          />
        </div>
      </div>

      {/* Lista de Chamados */}
      {loading ? (
        <div className="vagas-admin__loading">Carregando chamados...</div>
      ) : chamados.length === 0 ? (
        <div className="vagas-admin__empty">
          <p>Nenhum chamado encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {chamados.map((c) => {
            const stBadge = getStatusBadge(c.status);
            const prClass = getPrioridadeBadgeClass(c.prioridade);

            return (
              <div
                key={c.id}
                className="denuncia-card"
                onClick={() => handleOpenDetail(c)}
                style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 'var(--spacing-sm)' }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: stBadge.bg,
                        color: stBadge.color,
                        border: stBadge.border,
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase'
                      }}>
                        {stBadge.label}
                      </span>
                      <span className={prClass}>
                        Prioridade: {c.prioridade ? c.prioridade.toUpperCase() : 'N/A'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', margin: 0 }}>
                      #{c.id} — {c.titulo}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="btn btn--limpar btn--sm"
                    onClick={(e) => handleOpenDelete(e, c.id)}
                    title="Excluir Chamado"
                    style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', minHeight: '32px' }}
                  >
                    <IconTrash size={14} /> Excluir
                  </button>
                </div>

                {/* Metadados: Solicitante e Prazo */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', paddingBottom: 'var(--spacing-xs)', borderBottom: '1px dashed var(--color-gray-200)' }}>
                  <span><strong>Solicitado por:</strong> {c.solicitante}</span>
                  <span><IconClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Prazo Previsto:</strong> {formatDate(c.prazoConclusao)}</span>
                  <span><strong>Criado em:</strong> {formatDateTime(c.dataCriacao)} ({c.criadoPor})</span>
                </div>

                {/* Descrição */}
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--line-height-relaxed)',
                  color: 'var(--color-gray-700)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {c.descricao}
                </p>

                {c.resolucao && (
                  <div style={{ marginTop: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-green)' }}>
                    <strong>Resolução:</strong> {c.resolucao}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação de Chamado */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal__close" onClick={() => setShowCreateModal(false)} aria-label="Fechar">
              <IconClose size={18} />
            </button>

            <h2 className="modal__title">Novo Chamado de Suporte</h2>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label">Título / Assunto do Chamado *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Correção de permissão no módulo de denúncias"
                  value={newTitulo}
                  onChange={(e) => setNewTitulo(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label">Quem solicitou? *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Ana Maria (Diretoria Acácias)"
                    value={newSolicitante}
                    onChange={(e) => setNewSolicitante(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prioridade *</label>
                  <CustomSelect
                    value={newPrioridade}
                    onChange={setNewPrioridade}
                    options={PRIORIDADE_OPTIONS}
                    defaultOption="Selecione a prioridade"
                    allowEmpty={false}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label">Quando deverá ser concluído? (Prazo Previsto)</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPrazoConclusao}
                  onChange={(e) => setNewPrazoConclusao(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label">Descrição Detalhada do Chamado *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Descreva detalhadamente o problema ou solicitação recebida..."
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Como deverá ser executado? (Plano de Ação / Orientações)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Instruções de como a solução deve ser applied..."
                  value={newPlanoAcao}
                  onChange={(e) => setNewPlanoAcao(e.target.value)}
                />
              </div>

              {errorMessage && (
                <p style={{ color: 'var(--color-red)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>{errorMessage}</p>
              )}

              <div className="modal__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--blue"
                  disabled={submitting}
                >
                  {submitting ? 'Criando...' : 'Criar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes e Alteração de Status */}
      {showDetailModal && selectedChamado && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal__close" onClick={() => setShowDetailModal(false)} aria-label="Fechar">
              <IconClose size={18} />
            </button>

            <h2 className="modal__title">Chamado #{selectedChamado.id} — {selectedChamado.titulo}</h2>

            <form onSubmit={handleUpdateSubmit}>
              {/* Informações de Quem e Quando */}
              <div style={{
                backgroundColor: 'var(--color-gray-50)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-gray-200)',
                marginBottom: 'var(--spacing-lg)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-700)'
              }}>
                <div>
                  <strong>Quem solicitou:</strong> {selectedChamado.solicitante}
                </div>
                <div>
                  <strong>Prazo de conclusão:</strong> {formatDate(selectedChamado.prazoConclusao)}
                </div>
                <div>
                  <strong>Criado por:</strong> {selectedChamado.criadoPor}
                </div>
                <div>
                  <strong>Data de criação:</strong> {formatDateTime(selectedChamado.dataCriacao)}
                </div>
                {selectedChamado.dataEncerramento && (
                  <div style={{ gridColumn: 'span 2', color: 'var(--color-green)' }}>
                    <strong>Data de Encerramento:</strong> {formatDateTime(selectedChamado.dataEncerramento)}
                  </div>
                )}
              </div>

              {/* Descrição Detalhada */}
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>Descrição Detalhada</label>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--line-height-relaxed)',
                  color: 'var(--color-gray-900)',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'var(--color-white)',
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-gray-200)',
                  margin: 0
                }}>
                  {selectedChamado.descricao}
                </p>
              </div>

              {/* Plano de Ação */}
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>Plano de Ação / Instruções de Solução (Como)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Orientações e como o problema deve ser solucionado..."
                  value={editPlanoAcao}
                  onChange={(e) => setEditPlanoAcao(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>Alterar Status do Chamado *</label>
                <CustomSelect
                  value={editStatus}
                  onChange={setEditStatus}
                  options={STATUS_OPTIONS}
                  defaultOption="Selecione o status"
                  allowEmpty={false}
                />
              </div>

              {/* Resolução */}
              <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                  Descrição de Encerramento / Resolução {(editStatus === 'concluido' || editStatus === 'cancelado') ? '*' : '(Opcional)'}
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Registre detalhadamente como o chamado foi concluído ou motivo do cancelamento..."
                  value={editResolucao}
                  onChange={(e) => setEditResolucao(e.target.value)}
                  required={editStatus === 'concluido' || editStatus === 'cancelado'}
                />
              </div>

              {errorMessage && (
                <p style={{ color: 'var(--color-red)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>{errorMessage}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn--limpar"
                  onClick={(e) => handleOpenDelete(e, selectedChamado.id)}
                >
                  <IconTrash size={14} /> Excluir
                </button>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setShowDetailModal(false)}
                    disabled={submitting}
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--blue"
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <IconWarning size={48} style={{ color: 'var(--color-orange)', marginBottom: 'var(--spacing-sm)' }} />
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', margin: 'var(--spacing-xs) 0' }}>Excluir Chamado?</h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', margin: 0 }}>
                Tem certeza que deseja excluir permanentemente este chamado de suporte?
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
