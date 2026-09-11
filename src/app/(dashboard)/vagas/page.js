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
import { IconMapPin, IconBriefcase, IconFolder, IconClose, IconTrash, IconMail, IconPhone, IconEye, IconDownload, IconWarning, IconPlus, IconClock, IconUser } from '@/components/Icons';

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
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'banco-talentos') {
          setMainTab('banco-talentos');
        }
      }
    });
    return () => {
      active = false;
    };
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

  const totalTalentosBanco = bancos.reduce((acc, b) => acc + (b.totalTalentos || 0), 0);

  return (
    <div className="vagas-admin">
      {/* Header com Título Padronizado e Botão de Nova Vaga */}
      <div className="vagas-admin__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 className="statistics-page__title">
            {mainTab === 'vagas' ? 'Gestão de Vagas' : 'Banco de Talentos'}
          </h1>
        </div>

        {(user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
          <button 
            type="button" 
            className="btn btn--primary" 
            onClick={handleOpenCreate}
            style={{ 
              minHeight: '40px', 
              height: '40px', 
              padding: '0 20px', 
              gap: '8px', 
              fontSize: '13px'
            }}
          >
            <IconPlus size={16} /> Nova Vaga
          </button>
        )}
      </div>

      {/* Tabs Padronizadas da Plataforma (igual a Denúncias, Estatísticas e Mensagens) */}
      <div className="statistics-tabs">
        <button
          type="button"
          className={`statistics-tab ${mainTab === 'vagas' && statusFilter === '' ? 'statistics-tab--active' : ''}`}
          onClick={() => {
            setMainTab('vagas');
            setStatusFilter('');
          }}
        >
          Todas
        </button>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`statistics-tab ${mainTab === 'vagas' && statusFilter === key ? 'statistics-tab--active' : ''}`}
            onClick={() => {
              setMainTab('vagas');
              setStatusFilter(key);
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={`statistics-tab ${mainTab === 'banco-talentos' ? 'statistics-tab--active' : ''}`}
          onClick={() => setMainTab('banco-talentos')}
        >
          <span>Banco de Talentos</span>
          {totalTalentosBanco > 0 && (
            <span className="statistics-tab__badge">
              {totalTalentosBanco}
            </span>
          )}
        </button>
      </div>

      {/* Filtro por Unidade para Suporte (Alinhado à direita para ambas as abas) */}
      {user?.nivel === 'suporte' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Filtrar por Unidade:</span>
            <CustomSelect
              value={mainTab === 'vagas' ? unidadeFilter : unidadeFilterBanco}
              onChange={mainTab === 'vagas' ? setUnidadeFilter : setUnidadeFilterBanco}
              options={UNIDADES.map((u) => ({ value: u, label: u }))}
              defaultOption="Todas as Unidades"
              style={{ minWidth: '220px' }}
            />
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 1: VAGAS */}
      {mainTab === 'vagas' && (
        <>
          {/* Lista de Vagas */}
          {loadingVagas ? (
            <div className="vagas-admin__loading">Carregando vagas...</div>
          ) : vagas.length === 0 ? (
            <div className="vagas-empty-state">
              <div className="vagas-empty-state__icon-wrap">
                <IconBriefcase size={36} />
              </div>
              <h3 className="vagas-empty-state__title">Nenhuma vaga encontrada</h3>
              <p className="vagas-empty-state__description">
                Não há vagas cadastradas com os filtros selecionados.
              </p>
              {(user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
                <button type="button" className="btn btn--primary" onClick={handleOpenCreate} style={{ minHeight: '38px', height: '38px', padding: '0 18px', fontSize: '13px' }}>
                  <IconPlus size={15} /> Criar primeira vaga
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
                    <span className="vaga-card__date" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconClock size={12} /> {formatDate(vaga.dataCriacao)}
                    </span>
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
          {/* Lista de Bancos por Vaga */}
          {loadingBancos ? (
            <div className="vagas-admin__loading">Carregando banco de talentos...</div>
          ) : bancos.length === 0 ? (
            <div className="vagas-empty-state">
              <div className="vagas-empty-state__icon-wrap">
                <IconFolder size={36} />
              </div>
              <h3 className="vagas-empty-state__title">Nenhum currículo no Banco de Talentos</h3>
              <p className="vagas-empty-state__description">
                Candidaturas arquivadas de processos seletivos encerrados aparecerão aqui organizadas por cargo para futuras oportunidades.
              </p>
            </div>
          ) : (
            <div className="vagas-admin__grid">
              {bancos.map((banco) => (
                <div
                  key={banco.vagaId}
                  className="banco-card"
                  onClick={() => handleOpenBancoDetail(banco)}
                >
                  <div className="banco-card__header">
                    <div className="banco-card__tag">
                      <IconFolder size={13} />
                      <span>Arquivo de Talentos</span>
                    </div>
                    <div className="banco-card__date">
                      <IconClock size={13} />
                      <span>Atualizado em {formatDate(banco.ultimaMovimentacao)}</span>
                    </div>
                  </div>

                  <h3 className="banco-card__title">{banco.vagaTitulo}</h3>

                  <div className="banco-card__dept">
                    <IconMapPin size={14} />
                    <span>{banco.vagaUnidade}</span>
                  </div>

                  <div className="banco-card__footer">
                    <div className="banco-card__count">
                      <IconUser size={13} />
                      <span>
                        <strong>{banco.totalTalentos || 0}</strong> candidato{(banco.totalTalentos || 0) !== 1 ? 's' : ''} arquivado{(banco.totalTalentos || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="banco-card__action">
                      Ver currículos <span style={{ fontSize: '15px' }}>&rarr;</span>
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
                    <button className="btn btn--secondary btn--sm" onClick={() => handleOpenEdit(selectedVaga)}>
                      Editar Vaga
                    </button>

                    {selectedVaga.status === 'ativo' && (
                      <>
                        <button
                          className="btn btn--warning btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'em_selecao')}
                        >
                          Iniciar Seleção
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'fechado')}
                        >
                          Fechar Vaga
                        </button>
                      </>
                    )}

                    {selectedVaga.status === 'em_selecao' && (
                      <>
                        <button
                          className="btn btn--success btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'ativo')}
                        >
                          Reabrir Vaga
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'fechado')}
                        >
                          Fechar Vaga
                        </button>
                      </>
                    )}

                    {selectedVaga.status === 'fechado' && (
                      <>
                        <button
                          className="btn btn--success btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'ativo')}
                        >
                          Reabrir Vaga
                        </button>
                        <button
                          className="btn btn--warning btn--sm"
                          onClick={() => handleChangeStatus(selectedVaga, 'em_selecao')}
                        >
                          Mover para Em Seleção
                        </button>
                      </>
                    )}

                    {/* Botão de Excluir Vaga */}
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => setShowDeleteConfirm(true)}
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
                Tem certeza que deseja excluir a vaga <strong>&ldquo;{selectedVaga.titulo}&rdquo;</strong>?
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
                className="btn btn--outline btn--sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingVaga}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={handleConfirmDelete}
                disabled={deletingVaga}
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
            <div className="vagas-modal__header" style={{ alignItems: 'flex-start', paddingBottom: '16px' }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EEF2FF',
                  color: 'var(--color-primary, #1B1464)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}>
                  <IconFolder size={12} /> Banco de Talentos
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-gray-900)', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
                  {selectedBanco.vagaTitulo}
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--color-gray-600)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconMapPin size={13} /> {selectedBanco.vagaUnidade}
                  </span>
                  <span>&bull;</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconClock size={13} /> Atualizado em {formatDate(selectedBanco.ultimaMovimentacao)}
                  </span>
                </p>
              </div>
              <button className="vagas-modal__close" onClick={() => setShowBancoDetailModal(false)}><IconClose size={18} /></button>
            </div>

            <div className="statistics-tabs" style={{ padding: '0 24px', margin: 0 }}>
              <button type="button" className="statistics-tab statistics-tab--active">
                <span>Candidatos Arquivados</span>
                <span className="statistics-tab__badge">
                  {talentos.length}
                </span>
              </button>
            </div>

            <div className="vagas-modal__content">
              {loadingTalentos ? (
                <div className="vagas-admin__loading">Carregando candidatos...</div>
              ) : talentos.length === 0 ? (
                <div className="vagas-empty-state" style={{ margin: '24px', padding: '40px 20px', border: 'none', background: 'transparent' }}>
                  <div className="vagas-empty-state__icon-wrap">
                    <IconFolder size={32} />
                  </div>
                  <h3 className="vagas-empty-state__title" style={{ fontSize: '1rem' }}>Nenhuma candidatura arquivada encontrada</h3>
                  <p className="vagas-empty-state__description" style={{ fontSize: '13px' }}>
                    Não constam currículos arquivados para esta vaga até o momento.
                  </p>
                </div>
              ) : (
                <div className="candidaturas-list">
                  {talentos.map((talento) => (
                    <div key={talento.id} className="candidatura-card">
                      <div className="candidatura-card__info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h4 className="candidatura-card__name" style={{ margin: 0 }}>{talento.nomeCompleto}</h4>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E'
                          }}>
                            Arquivado
                          </span>
                        </div>
                        <p className="candidatura-card__detail">
                          <IconMail size={13} /> {talento.email} &nbsp;|&nbsp; <IconPhone size={13} /> {talento.telefone}
                        </p>
                        <p className="candidatura-card__date" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconClock size={12} /> Enviado em {formatDate(talento.dataEnvioOriginal)} &bull; Arquivado em {formatDate(talento.dataMovimentacao)}
                        </p>
                        {talento.cartaApresentacao && (
                          <div className="candidatura-card__carta" style={{ borderLeft: '3px solid var(--color-primary, #1B1464)', borderRadius: '4px', padding: '10px 14px' }}>
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
