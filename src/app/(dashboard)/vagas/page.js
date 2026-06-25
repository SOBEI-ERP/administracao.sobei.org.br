'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchVagas, criarVaga, atualizarVaga, fetchCandidaturas, downloadCurriculo, visualizarCurriculo } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_LABELS = {
  aberta: 'Aberta',
  pausada: 'Pausada',
  fechada: 'Fechada',
};

const STATUS_COLORS = {
  aberta: 'var(--color-success, #22c55e)',
  pausada: 'var(--color-warning, #f59e0b)',
  fechada: 'var(--color-danger, #ef4444)',
};

const MODALIDADE_LABELS = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

const CONTRATO_LABELS = {
  clt: 'CLT',
  estagio: 'Estágio',
  pj: 'PJ',
  temporario: 'Temporário',
};

const INITIAL_FORM = {
  titulo: '',
  departamento: '',
  descricao: '',
  requisitos: '',
  beneficios: '',
  modalidade: 'presencial',
  tipoContrato: 'clt',
};

export default function VagasPage() {
  const { user } = useAuth();
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingVaga, setEditingVaga] = useState(null);
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Candidaturas
  const [candidaturas, setCandidaturas] = useState([]);
  const [loadingCandidaturas, setLoadingCandidaturas] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const loadVagas = useCallback(async () => {
    setLoading(true);
    const data = await fetchVagas(statusFilter);
    setVagas(data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadVagas();
  }, [loadVagas]);

  const handleOpenCreate = () => {
    setEditingVaga(null);
    setFormData(INITIAL_FORM);
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (vaga) => {
    setEditingVaga(vaga);
    setFormData({
      titulo: vaga.titulo,
      departamento: vaga.departamento,
      descricao: vaga.descricao,
      requisitos: vaga.requisitos,
      beneficios: vaga.beneficios || '',
      modalidade: vaga.modalidade,
      tipoContrato: vaga.tipoContrato,
    });
    setFormError('');
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleOpenDetail = async (vaga) => {
    setSelectedVaga(vaga);
    setActiveTab('info');
    setShowDetailModal(true);
    // Pre-load candidaturas
    setLoadingCandidaturas(true);
    const cands = await fetchCandidaturas(vaga.id);
    setCandidaturas(cands);
    setLoadingCandidaturas(false);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    let result;
    if (editingVaga) {
      result = await atualizarVaga(editingVaga.id, {
        ...formData,
        status: editingVaga.status,
      });
    } else {
      result = await criarVaga(formData);
    }

    if (result.success) {
      setShowFormModal(false);
      loadVagas();
    } else {
      setFormError(result.message);
    }
    setSubmitting(false);
  };

  const handleChangeStatus = async (vaga, newStatus) => {
    const result = await atualizarVaga(vaga.id, {
      titulo: vaga.titulo,
      departamento: vaga.departamento,
      descricao: vaga.descricao,
      requisitos: vaga.requisitos,
      beneficios: vaga.beneficios || '',
      modalidade: vaga.modalidade,
      tipoContrato: vaga.tipoContrato,
      status: newStatus,
    });

    if (result.success) {
      setSelectedVaga({ ...vaga, status: newStatus });
      loadVagas();
    }
  };

  const handleDownloadCurriculo = async (candidaturaId, nomeArquivo) => {
    await downloadCurriculo(candidaturaId, nomeArquivo);
  };

  const handleVisualizarCurriculo = async (candidaturaId) => {
    await visualizarCurriculo(candidaturaId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="vagas-admin">
      {/* Header */}
      <div className="vagas-admin__header">
        <div>
          <h1 className="vagas-admin__title">Vagas</h1>
          <p className="vagas-admin__subtitle">
            Gerencie as vagas da unidade <strong>{user?.unidade || '—'}</strong>
          </p>
        </div>
        <button className="vagas-admin__btn-create" onClick={handleOpenCreate}>
          + Nova Vaga
        </button>
      </div>

      {/* Filtros */}
      <div className="vagas-admin__filters">
        <button
          className={`vagas-admin__filter-btn ${statusFilter === '' ? 'vagas-admin__filter-btn--active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          Todas
        </button>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`vagas-admin__filter-btn ${statusFilter === key ? 'vagas-admin__filter-btn--active' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="vagas-admin__loading">Carregando vagas...</div>
      ) : vagas.length === 0 ? (
        <div className="vagas-admin__empty">
          <p>Nenhuma vaga encontrada.</p>
          <button className="vagas-admin__btn-create" onClick={handleOpenCreate}>
            Criar primeira vaga
          </button>
        </div>
      ) : (
        <div className="vagas-admin__grid">
          {vagas.map((vaga) => (
            <div
              key={vaga.id}
              className="vaga-card"
              onClick={() => handleOpenDetail(vaga)}
            >
              <div className="vaga-card__header">
                <span
                  className="vaga-card__status"
                  style={{ backgroundColor: STATUS_COLORS[vaga.status] }}
                >
                  {STATUS_LABELS[vaga.status]}
                </span>
                <span className="vaga-card__date">{formatDate(vaga.dataCriacao)}</span>
              </div>
              <h3 className="vaga-card__title">{vaga.titulo}</h3>
              <p className="vaga-card__dept">{vaga.departamento}</p>
              <div className="vaga-card__footer">
                <span className="vaga-card__tag">
                  {MODALIDADE_LABELS[vaga.modalidade]} • {CONTRATO_LABELS[vaga.tipoContrato]}
                </span>
                <span className="vaga-card__candidaturas">
                  {vaga.totalCandidaturas || 0} candidatura{(vaga.totalCandidaturas || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showFormModal && (
        <div className="vagas-modal__overlay" onClick={() => setShowFormModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vagas-modal__header">
              <h2>{editingVaga ? 'Editar Vaga' : 'Nova Vaga'}</h2>
              <button className="vagas-modal__close" onClick={() => setShowFormModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm} className="vagas-modal__form">
              <div className="vagas-form__group">
                <label>Título da Vaga *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Educador Social"
                  required
                />
              </div>

              <div className="vagas-form__group">
                <label>Departamento / Área *</label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  placeholder="Ex: Pedagógico"
                  required
                />
              </div>

              <div className="vagas-form__row">
                <div className="vagas-form__group">
                  <label>Modalidade *</label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                  >
                    {Object.entries(MODALIDADE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="vagas-form__group">
                  <label>Tipo de Contrato *</label>
                  <select
                    value={formData.tipoContrato}
                    onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                  >
                    {Object.entries(CONTRATO_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="vagas-form__group">
                <label>Descrição da Vaga *</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva as responsabilidades e o dia a dia da vaga..."
                  rows={4}
                  required
                />
              </div>

              <div className="vagas-form__group">
                <label>Requisitos *</label>
                <textarea
                  value={formData.requisitos}
                  onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                  placeholder="Liste os requisitos separados por linha..."
                  rows={4}
                  required
                />
              </div>

              <div className="vagas-form__group">
                <label>Benefícios</label>
                <textarea
                  value={formData.beneficios}
                  onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                  placeholder="Ex: Vale Transporte, Vale Refeição..."
                  rows={2}
                />
              </div>

              {formError && <p className="vagas-form__error">{formError}</p>}

              <div className="vagas-form__actions">
                <button type="button" className="vagas-form__btn-cancel" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="vagas-form__btn-submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingVaga ? 'Salvar Alterações' : 'Criar Vaga')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetailModal && selectedVaga && (
        <div className="vagas-modal__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="vagas-modal vagas-modal--detail" onClick={(e) => e.stopPropagation()}>
            <div className="vagas-modal__header">
              <h2>{selectedVaga.titulo}</h2>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div className="vagas-modal__tabs">
              <button
                className={`vagas-modal__tab ${activeTab === 'info' ? 'vagas-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Informações
              </button>
              <button
                className={`vagas-modal__tab ${activeTab === 'candidaturas' ? 'vagas-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('candidaturas')}
              >
                Candidaturas ({selectedVaga.totalCandidaturas || 0})
              </button>
            </div>

            {activeTab === 'info' ? (
              <div className="vagas-modal__content">
                <div className="vagas-detail__meta">
                  <span
                    className="vaga-card__status"
                    style={{ backgroundColor: STATUS_COLORS[selectedVaga.status] }}
                  >
                    {STATUS_LABELS[selectedVaga.status]}
                  </span>
                  <span>{MODALIDADE_LABELS[selectedVaga.modalidade]} • {CONTRATO_LABELS[selectedVaga.tipoContrato]}</span>
                  <span>Criada em {formatDate(selectedVaga.dataCriacao)}</span>
                </div>

                <div className="vagas-detail__section">
                  <h3>Departamento</h3>
                  <p>{selectedVaga.departamento}</p>
                </div>

                <div className="vagas-detail__section">
                  <h3>Descrição</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedVaga.descricao}</p>
                </div>

                <div className="vagas-detail__section">
                  <h3>Requisitos</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedVaga.requisitos}</p>
                </div>

                {selectedVaga.beneficios && (
                  <div className="vagas-detail__section">
                    <h3>Benefícios</h3>
                    <p>{selectedVaga.beneficios}</p>
                  </div>
                )}

                <div className="vagas-detail__actions">
                  <button className="vagas-form__btn-submit" onClick={() => handleOpenEdit(selectedVaga)}>
                    Editar Vaga
                  </button>

                  {selectedVaga.status === 'aberta' && (
                    <button
                      className="vagas-form__btn-cancel"
                      onClick={() => handleChangeStatus(selectedVaga, 'pausada')}
                    >
                      Pausar Vaga
                    </button>
                  )}

                  {selectedVaga.status === 'pausada' && (
                    <>
                      <button
                        className="vagas-form__btn-submit"
                        onClick={() => handleChangeStatus(selectedVaga, 'aberta')}
                      >
                        Reabrir Vaga
                      </button>
                      <button
                        className="vagas-detail__btn-close"
                        onClick={() => handleChangeStatus(selectedVaga, 'fechada')}
                      >
                        Fechar Vaga
                      </button>
                    </>
                  )}

                  {selectedVaga.status === 'aberta' && (
                    <button
                      className="vagas-detail__btn-close"
                      onClick={() => handleChangeStatus(selectedVaga, 'fechada')}
                    >
                      Fechar Vaga
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="vagas-modal__content">
                {loadingCandidaturas ? (
                  <div className="vagas-admin__loading">Carregando candidaturas...</div>
                ) : candidaturas.length === 0 ? (
                  <div className="vagas-admin__empty">
                    <p>Nenhuma candidatura recebida para esta vaga.</p>
                  </div>
                ) : (
                  <div className="candidaturas-list">
                    {candidaturas.map((cand) => (
                      <div key={cand.id} className="candidatura-card">
                        <div className="candidatura-card__info">
                          <h4 className="candidatura-card__name">{cand.nomeCompleto}</h4>
                          <p className="candidatura-card__detail">
                            📧 {cand.email} &nbsp;|&nbsp; 📱 {cand.telefone}
                          </p>
                          <p className="candidatura-card__date">
                            Enviado em {formatDate(cand.dataEnvio)}
                          </p>
                          {cand.cartaApresentacao && (
                            <div className="candidatura-card__carta">
                              <strong>Carta de apresentação:</strong>
                              <p>{cand.cartaApresentacao}</p>
                            </div>
                          )}
                        </div>
                        <div className="candidatura-card__actions">
                          <button
                            className="candidatura-card__download candidatura-card__download--primary"
                            onClick={() => handleVisualizarCurriculo(cand.id)}
                            type="button"
                          >
                            👁️ Visualizar
                          </button>
                          <button
                            className="candidatura-card__download"
                            onClick={() => handleDownloadCurriculo(cand.id, cand.curriculoNome)}
                            type="button"
                          >
                            📥 Baixar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
