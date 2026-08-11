'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchChamados, criarChamado, atualizarChamado, deletarChamado } from '@/lib/api';
import CustomSelect from '@/components/admin/CustomSelect';
import { IconClock, IconCheck, IconTrash, IconClose, IconWarning, IconInfo, IconPlus } from '@/components/Icons';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_informacao', label: 'Aguardando Informação' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PRIORIDADE_OPTIONS = [
  { value: '', label: 'Todas as Prioridades' },
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
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          backgroundColor: '#fff',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid var(--color-gray-200, #e2e8f0)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <IconWarning size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Acesso Restrito</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
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
    setSubmitting(true);

    const payload = {
      titulo: newTitulo,
      solicitante: newSolicitante,
      prioridade: newPrioridade,
      prazoConclusao: newPrazoConclusao || null,
      descricao: newDescricao,
      planoAcao: newPlanoAcao || null,
    };

    const res = await criarChamado(payload);
    if (res.success) {
      setShowCreateModal(false);
      loadChamados();
    } else {
      setErrorMessage(res.message || 'Erro ao criar chamado.');
    }
    setSubmitting(false);
  };

  const handleOpenDetail = (c) => {
    setSelectedChamado(c);
    setEditStatus(c.status);
    setEditResolucao(c.resolucao || '');
    setEditPlanoAcao(c.planoAcao || '');
    setErrorMessage('');
    setShowDetailModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChamado) return;
    setErrorMessage('');
    setSubmitting(true);

    if ((editStatus === 'concluido' || editStatus === 'cancelado') && (!editResolucao || !editResolucao.trim())) {
      setErrorMessage('Ao concluir ou cancelar um chamado, é obrigatório preencher a descrição de como ele foi encerrado.');
      setSubmitting(false);
      return;
    }

    const payload = {
      status: editStatus,
      resolucao: editResolucao,
      planoAcao: editPlanoAcao,
    };

    const res = await atualizarChamado(selectedChamado.id, payload);
    if (res.success) {
      setShowDetailModal(false);
      loadChamados();
    } else {
      setErrorMessage(res.message || 'Erro ao atualizar chamado.');
    }
    setSubmitting(false);
  };

  const handleOpenDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await deletarChamado(deletingId);
    if (res.success) {
      setChamados((prev) => prev.filter((c) => c.id !== deletingId));
      if (selectedChamado && selectedChamado.id === deletingId) {
        setShowDetailModal(false);
        setSelectedChamado(null);
      }
      setShowDeleteModal(false);
      setDeletingId(null);
    }
    setDeleting(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
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
        return { label: 'Aberto', bg: '#dbeafe', color: '#1e40af' };
      case 'em_andamento':
        return { label: 'Em Andamento', bg: '#f3e8ff', color: '#6b21a8' };
      case 'aguardando_informacao':
        return { label: 'Aguardando Informação', bg: '#fef3c7', color: '#92400e' };
      case 'concluido':
        return { label: 'Concluído', bg: '#dcfce7', color: '#166534' };
      case 'cancelado':
        return { label: 'Cancelado', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: status, bg: '#e2e8f0', color: '#334155' };
    }
  };

  const getPrioridadeBadge = (prioridade) => {
    switch (prioridade) {
      case 'baixa':
        return { label: 'Baixa', bg: '#f1f5f9', color: '#475569' };
      case 'media':
        return { label: 'Média', bg: '#e0f2fe', color: '#0369a1' };
      case 'alta':
        return { label: 'Alta', bg: '#ffedd5', color: '#c2410c' };
      case 'urgente':
        return { label: 'Urgente', bg: '#fee2e2', color: '#b91c1c' };
      default:
        return { label: prioridade, bg: '#e2e8f0', color: '#334155' };
    }
  };

  const totalCount = chamados.length;
  const abertosCount = chamados.filter((c) => c.status === 'aberto').length;
  const emAndamentoCount = chamados.filter((c) => c.status === 'em_andamento' || c.status === 'aguardando_informacao').length;
  const concluidosCount = chamados.filter((c) => c.status === 'concluido').length;

  return (
    <div className="vagas-admin">
      {/* Header */}
      <div className="vagas-admin__header" style={{ flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="vagas-admin__title">Chamados de Suporte</h1>
          <p className="vagas-admin__subtitle">
            Gestão interna de solicitações técnicas, prazos e soluções (Exclusivo Suporte)
          </p>
        </div>
        <button
          type="button"
          className="form-submit-btn"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '200px' }}
        >
          <IconPlus size={18} /> Novo Chamado
        </button>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Total de Chamados</span>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>{totalCount}</p>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>Abertos</span>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: '4px 0 0 0' }}>{abertosCount}</p>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8', textTransform: 'uppercase' }}>Em Andamento</span>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b21a8', margin: '4px 0 0 0' }}>{emAndamentoCount}</p>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>Concluídos</span>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: '4px 0 0 0' }}>{concluidosCount}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="vagas-admin__filters" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Status:</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            defaultOption="Todos os Status"
            style={{ minWidth: '200px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Prioridade:</span>
          <CustomSelect
            value={prioridadeFilter}
            onChange={setPrioridadeFilter}
            options={PRIORIDADE_OPTIONS}
            defaultOption="Todas as Prioridades"
            style={{ minWidth: '200px' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chamados.map((c) => {
            const stBadge = getStatusBadge(c.status);
            const prBadge = getPrioridadeBadge(c.prioridade);

            return (
              <div
                key={c.id}
                onClick={() => handleOpenDetail(c)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        backgroundColor: stBadge.bg,
                        color: stBadge.color,
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        {stBadge.label}
                      </span>
                      <span style={{
                        backgroundColor: prBadge.bg,
                        color: prBadge.color,
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        Prioridade: {prBadge.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                      #{c.id} — {c.titulo}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(e, c.id)}
                      style={{
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>

                {/* Metadados: Solicitante e Prazo */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#475569', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                  <span><strong>Solicitado por:</strong> {c.solicitante}</span>
                  <span><IconClock size={13} /> <strong>Prazo Previsto:</strong> {formatDate(c.prazoConclusao)}</span>
                  <span><strong>Criado em:</strong> {formatDateTime(c.dataCriacao)} ({c.criadoPor})</span>
                </div>

                {/* Descrição */}
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#334155',
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
                  <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', color: '#166534' }}>
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
        <div className="vagas-modal__overlay" onClick={() => setShowCreateModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
            <div className="vagas-modal__header">
              <h2>Novo Chamado de Suporte</h2>
              <button className="vagas-modal__close" onClick={() => setShowCreateModal(false)}><IconClose size={18} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
                  <select
                    className="form-input"
                    value={newPrioridade}
                    onChange={(e) => setNewPrioridade(e.target.value)}
                    required
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Quando deverá ser concluído? (Prazo Previsto)</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPrazoConclusao}
                  onChange={(e) => setNewPrazoConclusao(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
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

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Como deverá ser executado? (Plano de Ação / Orientações)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Instruções de como a solução deve ser aplicada..."
                  value={newPlanoAcao}
                  onChange={(e) => setNewPlanoAcao(e.target.value)}
                />
              </div>

              {errorMessage && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{errorMessage}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="vagas-form__btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={submitting}
                  style={{ maxWidth: '180px' }}
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
        <div className="vagas-modal__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
            <div className="vagas-modal__header">
              <h2>Chamado #{selectedChamado.id} — {selectedChamado.titulo}</h2>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}><IconClose size={18} /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ padding: '24px' }}>
              {/* Informações de Quem e Quando */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#334155' }}>
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
                  <div style={{ gridColumn: 'span 2', color: '#166534' }}>
                    <strong>Data de Encerramento:</strong> {formatDateTime(selectedChamado.dataEncerramento)}
                  </div>
                )}
              </div>

              {/* Descrição Detalhada */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>Descrição Detalhada</label>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#1e293b', whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: 0 }}>
                  {selectedChamado.descricao}
                </p>
              </div>

              {/* Plano de Ação (Como deverá ser feito) */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>Plano de Ação / Instruções de Solução (Como)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Orientações e como o problema deve ser solucionado..."
                  value={editPlanoAcao}
                  onChange={(e) => setEditPlanoAcao(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>Alterar Status do Chamado *</label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_informacao">Aguardando Informação</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Como foi encerrado (Resolução) */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>
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
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{errorMessage}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => handleOpenDelete(e, selectedChamado.id)}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#ef4444',
                    border: '1px solid #fecaca',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <IconTrash size={14} /> Excluir
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="vagas-form__btn-cancel"
                    onClick={() => setShowDetailModal(false)}
                    disabled={submitting}
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="form-submit-btn"
                    disabled={submitting}
                    style={{ maxWidth: '180px' }}
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
        <div className="vagas-modal__overlay" style={{ zIndex: 1100 }} onClick={() => setShowDeleteModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <IconWarning size={42} style={{ color: '#f59e0b' }} />
              <h2 style={{ fontSize: '20px', color: '#111827', marginTop: '8px', marginBottom: '4px' }}>Excluir Chamado?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Tem certeza que deseja excluir permanentemente este chamado de suporte?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="vagas-form__btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1
                }}
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
