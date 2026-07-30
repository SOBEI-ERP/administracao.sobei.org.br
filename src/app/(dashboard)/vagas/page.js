'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  fetchVagas, 
  criarVaga, 
  atualizarVaga, 
  deletarVaga, 
  fetchCandidaturas, 
  downloadCurriculo, 
  visualizarCurriculo,
  fetchBancoTalentos,
  fetchTalentosPorVaga,
  downloadCurriculoTalento,
  visualizarCurriculoTalento
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';
import { IconMapPin, IconBriefcase, IconFolder, IconClose, IconTrash, IconMail, IconPhone, IconEye, IconDownload, IconWarning } from '@/components/Icons';

const STATUS_LABELS = {
  ativo: 'Ativo',
  em_selecao: 'Em Seleção',
  fechado: 'Fechado',
};

const STATUS_COLORS = {
  ativo: 'var(--color-success, #22c55e)',
  em_selecao: 'var(--color-warning, #f59e0b)',
  fechado: 'var(--color-danger, #ef4444)',
};

const MODALIDADE_LABELS = {
  presencial: 'Presencial',
};

const CONTRATO_LABELS = {
  clt: 'CLT',
  pj: 'PJ',
  jovem_aprendiz: 'Jovem Aprendiz',
};

const getAvailableTitles = (unidade, currentTitle) => {
  if (!unidade) return [];
  const u = unidade.toLowerCase();
  
  let titles = [];
  if (u.includes('nci')) {
    titles = [
      'Psicólogo',
      'Assistente Social',
      'Técnico Socioeducativo',
      'Coordenador',
      'Gerente',
      'Auxiliar de Cozinha e Limpeza',
      'Cozinheira'
    ];
  } else if (['ccinter', 'cedesp', 'telecentro', 'matriz'].includes(u)) {
    titles = [
      'Técnico Socioeducativo',
      'Coordenador',
      'Gerente',
      'Auxiliar de Cozinha e Limpeza',
      'Cozinheira'
    ];
  } else {
    // CEI (qualquer outra unidade)
    titles = [
      'Diretora Pedagógica',
      'Coordenadora Pedagógica',
      'Técnico de Enfermagem',
      'Auxiliar de Desenvolvimento Infantil',
      'Professora',
      'Auxiliar de Limpeza',
      'Auxiliar de Cozinha',
      'Auxiliar de Manutenção',
      'Jovem Aprendiz',
      'Cozinheira'
    ];
  }

  if (currentTitle && !titles.includes(currentTitle)) {
    titles.push(currentTitle);
  }

  return titles;
};

const INITIAL_FORM = {
  titulo: '',
  departamento: 'Geral',
  descricao: '',
  requisitos: '',
  beneficios: '',
  modalidade: 'presencial',
  tipoContrato: 'clt',
  unidade: '',
  status: 'ativo',
};

function VagasContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Tab State: 'vagas' | 'banco-talentos'
  const initialTab = searchParams.get('tab') === 'banco-talentos' ? 'banco-talentos' : 'vagas';
  const [mainTab, setMainTab] = useState(initialTab);

  // Vagas States
  const [vagas, setVagas] = useState([]);
  const [loadingVagas, setLoadingVagas] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');

  // Vaga Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVaga, setEditingVaga] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Vaga Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [candidaturas, setCandidaturas] = useState([]);
  const [loadingCandidaturas, setLoadingCandidaturas] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Delete Vaga Confirm Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingVaga, setDeletingVaga] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Banco de Talentos States
  const [bancos, setBancos] = useState([]);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const [unidadeFilterBanco, setUnidadeFilterBanco] = useState('');
  const [showBancoDetailModal, setShowBancoDetailModal] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState(null);
  const [talentos, setTalentos] = useState([]);
  const [loadingTalentos, setLoadingTalentos] = useState(false);

  // Sync query param tab if changed
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'banco-talentos') {
      setMainTab('banco-talentos');
    }
  }, [searchParams]);

  // Load Vagas
  const loadVagas = useCallback(async () => {
    setLoadingVagas(true);
    const data = await fetchVagas(statusFilter, unidadeFilter);
    setVagas(data);
    setLoadingVagas(false);
  }, [statusFilter, unidadeFilter]);

  // Load Banco de Talentos
  const loadBancos = useCallback(async () => {
    setLoadingBancos(true);
    const data = await fetchBancoTalentos(unidadeFilterBanco);
    setBancos(data);
    setLoadingBancos(false);
  }, [unidadeFilterBanco]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        if (mainTab === 'vagas') {
          loadVagas();
        } else {
          loadBancos();
        }
      }
    });
    return () => {
      active = false;
    };
  }, [mainTab, loadVagas, loadBancos]);

  // Handlers Vagas
  const handleOpenCreate = () => {
    setEditingVaga(null);
    setFormData({
      ...INITIAL_FORM,
      unidade: user?.nivel === 'diretora' ? (user?.unidade || '') : '',
    });
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
      unidade: vaga.unidade || '',
      status: vaga.status,
    });
    setFormError('');
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleOpenDetail = async (vaga) => {
    setSelectedVaga(vaga);
    setActiveTab('info');
    setShowDetailModal(true);
    setLoadingCandidaturas(true);
    const cands = await fetchCandidaturas(vaga.id);
    setCandidaturas(cands);
    setLoadingCandidaturas(false);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (user?.nivel === 'suporte' && !formData.unidade) {
      setFormError('A unidade é obrigatória');
      return;
    }
    if (!formData.titulo) {
      setFormError('O título da vaga é obrigatório');
      return;
    }

    setSubmitting(true);
    let result;
    if (editingVaga) {
      result = await atualizarVaga(editingVaga.id, {
        ...formData,
        status: formData.status || editingVaga.status,
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
      unidade: vaga.unidade,
    });

    if (result.success) {
      setSelectedVaga({ ...vaga, status: newStatus });
      loadVagas();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedVaga) return;
    setDeletingVaga(true);
    setDeleteError('');

    const res = await deletarVaga(selectedVaga.id);
    if (res.success) {
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedVaga(null);
      loadVagas();
    } else {
      setDeleteError(res.message || 'Erro ao excluir vaga.');
    }
    setDeletingVaga(false);
  };

  const handleDownloadCurriculo = async (candidaturaId, nomeArquivo) => {
    await downloadCurriculo(candidaturaId, nomeArquivo);
  };

  const handleVisualizarCurriculo = async (candidaturaId, nomeArquivo) => {
    await visualizarCurriculo(candidaturaId, nomeArquivo);
  };

  // Handlers Banco de Talentos
  const handleOpenBancoDetail = async (banco) => {
    setSelectedBanco(banco);
    setShowBancoDetailModal(true);
    setLoadingTalentos(true);
    const data = await fetchTalentosPorVaga(banco.vagaId);
    setTalentos(data);
    setLoadingTalentos(false);
  };

  const handleDownloadCurriculoTalento = async (talentoId, nomeArquivo) => {
    await downloadCurriculoTalento(talentoId, nomeArquivo);
  };

  const handleVisualizarCurriculoTalento = async (talentoId, nomeArquivo) => {
    await visualizarCurriculoTalento(talentoId, nomeArquivo);
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
      {/* Header com Seletor de Abas Principais */}
      <div className="vagas-admin__header" style={{ flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="vagas-admin__title">
            {mainTab === 'vagas' ? 'Gestão de Vagas' : 'Banco de Talentos'}
          </h1>
          <p className="vagas-admin__subtitle">
            {mainTab === 'vagas' ? (
              user?.nivel === 'suporte' ? (
                <span>Visualizando as vagas de <strong>todas as unidades</strong></span>
              ) : (
                <span>Gerencie as vagas da unidade <strong>{user?.unidade || '—'}</strong></span>
              )
            ) : (
              user?.nivel === 'suporte' ? (
                <span>Candidatos arquivados ao fechar vagas de <strong>todas as unidades</strong></span>
              ) : (
                <span>Histórico de candidatos arquivados da unidade <strong>{user?.unidade || '—'}</strong></span>
              )
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {/* Main Tab Toggle Buttons */}
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--color-gray-100, #f1f5f9)', 
            padding: '4px', 
            borderRadius: '10px',
            border: '1px solid var(--color-gray-200, #e2e8f0)' 
          }}>
            <button
              type="button"
              onClick={() => setMainTab('vagas')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mainTab === 'vagas' ? '#fff' : 'transparent',
                color: mainTab === 'vagas' ? 'var(--color-primary, #1b1464)' : 'var(--color-gray-600, #64748b)',
                fontWeight: mainTab === 'vagas' ? 'bold' : '500',
                fontSize: '14px',
                boxShadow: mainTab === 'vagas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconBriefcase size={14} /> Vagas
            </button>
            <button
              type="button"
              onClick={() => setMainTab('banco-talentos')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mainTab === 'banco-talentos' ? '#fff' : 'transparent',
                color: mainTab === 'banco-talentos' ? 'var(--color-primary, #1b1464)' : 'var(--color-gray-600, #64748b)',
                fontWeight: mainTab === 'banco-talentos' ? 'bold' : '500',
                fontSize: '14px',
                boxShadow: mainTab === 'banco-talentos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconFolder size={14} /> Banco de Talentos
            </button>
          </div>

          {mainTab === 'vagas' && (user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
            <button className="btn btn--secondary" onClick={handleOpenCreate}>
              + Nova Vaga
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: VAGAS */}
      {mainTab === 'vagas' && (
        <>
          {/* Filtros de Vagas */}
          <div className="vagas-admin__filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
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

            {user?.nivel === 'suporte' && (
              <div className="vagas-admin__unit-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Filtrar por Unidade:</span>
                <CustomSelect
                  value={unidadeFilter}
                  onChange={setUnidadeFilter}
                  options={UNIDADES.map((u) => ({ value: u, label: u }))}
                  defaultOption="Todas as Unidades"
                  style={{ minWidth: '220px' }}
                />
              </div>
            )}
          </div>

          {/* Lista de Vagas */}
          {loadingVagas ? (
            <div className="vagas-admin__loading">Carregando vagas...</div>
          ) : vagas.length === 0 ? (
            <div className="vagas-admin__empty">
              <p>Nenhuma vaga encontrada.</p>
              {(user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
                <button className="btn btn--secondary" onClick={handleOpenCreate}>
                  Criar primeira vaga
                </button>
              )}
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
                  <p className="vaga-card__dept">
                    <IconMapPin size={14} /> {vaga.unidade}
                  </p>
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
        </>
      )}

      {/* CONTEÚDO DA ABA 2: BANCO DE TALENTOS */}
      {mainTab === 'banco-talentos' && (
        <>
          {/* Filtro de Unidade para Suporte no Banco de Talentos */}
          {user?.nivel === 'suporte' && (
            <div className="vagas-admin__filters" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div className="vagas-admin__unit-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Filtrar por Unidade:</span>
                <CustomSelect
                  value={unidadeFilterBanco}
                  onChange={setUnidadeFilterBanco}
                  options={UNIDADES.map((u) => ({ value: u, label: u }))}
                  defaultOption="Todas as Unidades"
                  style={{ minWidth: '220px' }}
                />
              </div>
            </div>
          )}

          {/* Lista de Bancos por Vaga */}
          {loadingBancos ? (
            <div className="vagas-admin__loading">Carregando banco de talentos...</div>
          ) : bancos.length === 0 ? (
            <div className="vagas-admin__empty">
              <p>Nenhum banco de talentos encontrado.</p>
            </div>
          ) : (
            <div className="vagas-admin__grid">
              {bancos.map((banco) => (
                <div
                  key={banco.vagaId}
                  className="vaga-card"
                  onClick={() => handleOpenBancoDetail(banco)}
                  style={{ borderLeft: '4px solid var(--color-primary, #1b1464)' }}
                >
                  <div className="vaga-card__header">
                    <span
                      className="vaga-card__status"
                      style={{ backgroundColor: 'var(--color-primary, #1b1464)' }}
                    >
                      Banco de Talentos
                    </span>
                    <span className="vaga-card__date" title="Última movimentação">
                      Ativo em: {formatDate(banco.ultimaMovimentacao)}
                    </span>
                  </div>
                  <h3 className="vaga-card__title">{banco.vagaTitulo}</h3>
                  <p className="vaga-card__dept">
                    <IconMapPin size={14} /> {banco.vagaUnidade}
                  </p>
                  <div className="vaga-card__footer" style={{ marginTop: 'auto' }}>
                    <span className="vaga-card__candidaturas">
                      {banco.totalTalentos || 0} candidato{(banco.totalTalentos || 0) !== 1 ? 's' : ''} arquivado(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Criar/Editar Vaga */}
      {showFormModal && (
        <div className="vagas-modal__overlay" onClick={() => setShowFormModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95%' }}>
            <div className="vagas-modal__header">
              <h2>{editingVaga ? 'Editar Vaga' : 'Nova Vaga'}</h2>
              <button className="vagas-modal__close" onClick={() => setShowFormModal(false)}><IconClose size={18} /></button>
            </div>

            <div className="vagas-modal__split-container">
              {/* Form Col */}
              <form onSubmit={handleSubmitForm} className="vagas-modal__form-col">
                {user?.nivel === 'suporte' && (
                  <div className="vagas-form__group">
                    <label>Unidade *</label>
                    <CustomSelect
                      value={formData.unidade}
                      onChange={(val) => setFormData({ ...formData, unidade: val, titulo: '' })}
                      options={UNIDADES.map((u) => ({ value: u, label: u }))}
                      defaultOption="Selecione a unidade..."
                      allowEmpty={false}
                    />
                  </div>
                )}

                <div className="vagas-form__group">
                  <label>Título da Vaga *</label>
                  <CustomSelect
                    value={formData.titulo}
                    onChange={(val) => setFormData({ ...formData, titulo: val })}
                    options={getAvailableTitles(formData.unidade, editingVaga?.titulo).map((t) => ({ value: t, label: t }))}
                    defaultOption="Selecione a vaga..."
                    allowEmpty={false}
                  />
                </div>

                <div className="vagas-form__row">
                  <div className="vagas-form__group">
                    <label>Modalidade *</label>
                    <CustomSelect
                      value={formData.modalidade}
                      onChange={(val) => setFormData({ ...formData, modalidade: val })}
                      options={Object.entries(MODALIDADE_LABELS).map(([key, label]) => ({ value: key, label }))}
                      allowEmpty={false}
                    />
                  </div>

                  <div className="vagas-form__group">
                    <label>Tipo de Contrato *</label>
                    <CustomSelect
                      value={formData.tipoContrato}
                      onChange={(val) => setFormData({ ...formData, tipoContrato: val })}
                      options={Object.entries(CONTRATO_LABELS).map(([key, label]) => ({ value: key, label }))}
                      allowEmpty={false}
                    />
                  </div>
                </div>

                {editingVaga && (
                  <div className="vagas-form__group">
                    <label>Status *</label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      options={Object.entries(STATUS_LABELS).map(([key, label]) => ({ value: key, label }))}
                      allowEmpty={false}
                    />
                  </div>
                )}

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

              {/* Preview Col */}
              <div className="vagas-modal__preview-col">
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-gray-500)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Prévia da Exibição Pública
                </h3>

                <div style={{ background: '#fdfdfd', border: '1px solid var(--color-gray-200)', borderRadius: '12px', padding: '16px', pointerEvents: 'none', userSelect: 'none' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1b1464 0%, #2e3192 100%)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    color: '#fff',
                    marginBottom: '16px'
                  }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 8px', color: '#fff' }}>
                      {formData.titulo || 'Título da Vaga'}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>
                      <span><IconMapPin size={11} /> {formData.unidade || user?.unidade || 'Unidade'}</span>
                      <span><IconBriefcase size={11} /> {MODALIDADE_LABELS[formData.modalidade]} ({CONTRATO_LABELS[formData.tipoContrato]})</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '16px' }}>
                    <div style={{ background: '#fff', border: '1px solid var(--color-gray-100)', borderRadius: '6px', padding: '12px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1.5px solid #1b1464', paddingBottom: '4px', marginBottom: '8px', color: '#1b1464' }}>
                        Descrição da Vaga
                      </h4>
                      <p style={{ fontSize: '11px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--color-gray-700)', marginBottom: '12px' }}>
                        {formData.descricao || 'Descrição da vaga...'}
                      </p>

                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1.5px solid #1b1464', paddingBottom: '4px', marginBottom: '8px', color: '#1b1464' }}>
                        Requisitos e Qualificações
                      </h4>
                      <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: 'var(--color-gray-700)', lineHeight: '1.5' }}>
                        {(formData.requisitos || '').split('\n').filter(r => r.trim()).length > 0 ? (
                          (formData.requisitos || '').split('\n').filter(r => r.trim()).map((req, i) => (
                            <li key={i}>{req}</li>
                          ))
                        ) : (
                          <li style={{ listStyleType: 'none', color: '#999' }}>Requisitos...</li>
                        )}
                      </ul>

                      {formData.beneficios && (
                        <>
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1.5px solid #1b1464', paddingBottom: '4px', marginBottom: '8px', color: '#1b1464', marginTop: '12px' }}>
                            Benefícios
                          </h4>
                          <p style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--color-gray-700)' }}>
                            {formData.beneficios}
                          </p>
                        </>
                      )}
                    </div>

                    <div style={{ background: '#f8f9fa', border: '1px solid var(--color-gray-100)', borderRadius: '6px', padding: '12px', height: 'fit-content' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#1b1464' }}>
                        Candidatar-se
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        <div style={{ height: '20px', background: '#fff', border: '1px solid #ddd', borderRadius: '3px', padding: '0 6px', fontSize: '9px', color: '#aaa', display: 'flex', alignItems: 'center' }}>Nome</div>
                        <div style={{ height: '20px', background: '#fff', border: '1px solid #ddd', borderRadius: '3px', padding: '0 6px', fontSize: '9px', color: '#aaa', display: 'flex', alignItems: 'center' }}>E-mail</div>
                        <div style={{ height: '20px', background: '#fff', border: '1px solid #ddd', borderRadius: '3px', padding: '0 6px', fontSize: '9px', color: '#aaa', display: 'flex', alignItems: 'center' }}>Telefone</div>
                        <div style={{ height: '30px', background: '#fff', border: '1px dashed #bbb', borderRadius: '3px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#666' }}>
                          <span>Anexar currículo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Vaga */}
      {showDetailModal && selectedVaga && (
        <div className="vagas-modal__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="vagas-modal vagas-modal--detail" onClick={(e) => e.stopPropagation()}>
            <div className="vagas-modal__header">
              <h2>{selectedVaga.titulo}</h2>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}><IconClose size={18} /></button>
            </div>

            {/* Tabs do Modal */}
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
                <div className="vagas-detail__meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <div className="vagas-detail__status-select" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-gray-600)' }}>Status:</span>
                    <select
                      value={selectedVaga.status}
                      onChange={(e) => handleChangeStatus(selectedVaga, e.target.value)}
                      style={{
                        padding: '6px 24px 6px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--color-gray-300)',
                        backgroundColor: STATUS_COLORS[selectedVaga.status] || 'var(--color-gray-400)',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        outline: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'none\' stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '10px'
                      }}
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key} style={{ backgroundColor: '#fff', color: 'var(--color-gray-800)' }}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span>{MODALIDADE_LABELS[selectedVaga.modalidade]} • {CONTRATO_LABELS[selectedVaga.tipoContrato]}</span>
                  <span>Unidade: <strong>{selectedVaga.unidade}</strong></span>
                  <span>Criada em {formatDate(selectedVaga.dataCriacao)}</span>
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

                {(user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
                  <div className="vagas-detail__actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="vagas-form__btn-submit" onClick={() => handleOpenEdit(selectedVaga)}>
                      Editar Vaga
                    </button>

                    {selectedVaga.status === 'ativo' && (
                      <>
                        <button
                          className="vagas-form__btn-cancel"
                          onClick={() => handleChangeStatus(selectedVaga, 'em_selecao')}
                          style={{ borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning, #f59e0b)' }}
                        >
                          Iniciar Seleção
                        </button>
                        <button
                          className="vagas-detail__btn-close"
                          onClick={() => handleChangeStatus(selectedVaga, 'fechado')}
                        >
                          Fechar Vaga
                        </button>
                      </>
                    )}

                    {selectedVaga.status === 'em_selecao' && (
                      <>
                        <button
                          className="vagas-form__btn-submit"
                          onClick={() => handleChangeStatus(selectedVaga, 'ativo')}
                          style={{ backgroundColor: 'var(--color-success, #22c55e)' }}
                        >
                          Reabrir Vaga
                        </button>
                        <button
                          className="vagas-detail__btn-close"
                          onClick={() => handleChangeStatus(selectedVaga, 'fechado')}
                        >
                          Fechar Vaga
                        </button>
                      </>
                    )}

                    {selectedVaga.status === 'fechado' && (
                      <>
                        <button
                          className="vagas-form__btn-submit"
                          onClick={() => handleChangeStatus(selectedVaga, 'ativo')}
                          style={{ backgroundColor: 'var(--color-success, #22c55e)' }}
                        >
                          Reabrir Vaga
                        </button>
                        <button
                          className="vagas-form__btn-cancel"
                          onClick={() => handleChangeStatus(selectedVaga, 'em_selecao')}
                          style={{ borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning, #f59e0b)' }}
                        >
                          Mover para Em Seleção
                        </button>
                      </>
                    )}

                    {/* Botão de Excluir Vaga */}
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        marginLeft: 'auto',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                      <IconTrash size={14} /> Excluir Vaga
                    </button>
                  </div>
                )}
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
                            <IconMail size={13} /> {cand.email} &nbsp;|&nbsp; <IconPhone size={13} /> {cand.telefone}
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
                            onClick={() => handleVisualizarCurriculo(cand.id, cand.curriculoNome)}
                            type="button"
                          >
                            <IconEye size={14} /> Visualizar
                          </button>
                          <button
                            className="candidatura-card__download"
                            onClick={() => handleDownloadCurriculo(cand.id, cand.curriculoNome)}
                            type="button"
                          >
                            <IconDownload size={14} /> Baixar
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

      {/* Modal de Confirmação de Exclusão de Vaga */}
      {showDeleteConfirm && selectedVaga && (
        <div className="vagas-modal__overlay" style={{ zIndex: 1100 }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <IconWarning size={42} style={{ color: '#f59e0b' }} />
              <h2 style={{ fontSize: '20px', color: '#111827', marginTop: '8px', marginBottom: '4px' }}>Excluir Vaga?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Tem certeza que deseja excluir a vaga <strong>"{selectedVaga.titulo}"</strong>?
              </p>
            </div>

            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              fontSize: '13px',
              color: '#991b1b'
            }}>
              <strong>Atenção:</strong> Esta ação é irreversível. Todas as candidaturas ativas e o histórico do banco de talentos vinculado a esta vaga serão excluídos permanentemente (incluindo os currículos anexados).
            </div>

            {deleteError && (
              <p className="vagas-form__error" style={{ marginBottom: '16px' }}>{deleteError}</p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="vagas-form__btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingVaga}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingVaga}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: deletingVaga ? 'not-allowed' : 'pointer',
                  opacity: deletingVaga ? 0.7 : 1
                }}
              >
                {deletingVaga ? 'Excluindo...' : 'Sim, Excluir Vaga'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Banco de Talentos */}
      {showBancoDetailModal && selectedBanco && (
        <div className="vagas-modal__overlay" onClick={() => setShowBancoDetailModal(false)}>
          <div className="vagas-modal vagas-modal--detail" onClick={(e) => e.stopPropagation()}>
            <div className="vagas-modal__header">
              <h2>Banco de Talentos — {selectedBanco.vagaTitulo}</h2>
              <button className="vagas-modal__close" onClick={() => setShowBancoDetailModal(false)}><IconClose size={18} /></button>
            </div>

            <div className="vagas-modal__tabs">
              <button className="vagas-modal__tab vagas-modal__tab--active">
                Candidatos Arquivados ({selectedBanco.totalTalentos || 0})
              </button>
            </div>

            <div className="vagas-modal__content">
              {loadingTalentos ? (
                <div className="vagas-admin__loading">Carregando candidatos...</div>
              ) : talentos.length === 0 ? (
                <div className="vagas-admin__empty">
                  <p>Nenhuma candidatura arquivada encontrada.</p>
                </div>
              ) : (
                <div className="candidaturas-list">
                  {talentos.map((talento) => (
                    <div key={talento.id} className="candidatura-card">
                      <div className="candidatura-card__info">
                        <h4 className="candidatura-card__name">{talento.nomeCompleto}</h4>
                        <p className="candidatura-card__detail">
                          <IconMail size={13} /> {talento.email} &nbsp;|&nbsp; <IconPhone size={13} /> {talento.telefone}
                        </p>
                        <p className="candidatura-card__date">
                          Enviado originalmente em {formatDate(talento.dataEnvioOriginal)} &nbsp;|&nbsp; Arquivado em {formatDate(talento.dataMovimentacao)}
                        </p>
                        {talento.cartaApresentacao && (
                          <div className="candidatura-card__carta">
                            <strong>Carta de apresentação:</strong>
                            <p>{talento.cartaApresentacao}</p>
                          </div>
                        )}
                      </div>
                      <div className="candidatura-card__actions">
                        <button
                          className="candidatura-card__download candidatura-card__download--primary"
                          onClick={() => handleVisualizarCurriculoTalento(talento.id, talento.curriculoNome)}
                          type="button"
                        >
                          <IconEye size={14} /> Visualizar
                        </button>
                        <button
                          className="candidatura-card__download"
                          onClick={() => handleDownloadCurriculoTalento(talento.id, talento.curriculoNome)}
                          type="button"
                        >
                          <IconDownload size={14} /> Baixar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VagasPage() {
  return (
    <Suspense fallback={<div className="vagas-admin__loading">Carregando...</div>}>
      <VagasContent />
    </Suspense>
  );
}
