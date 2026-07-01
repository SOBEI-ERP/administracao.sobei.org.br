'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchVagas, criarVaga, atualizarVaga, fetchCandidaturas, downloadCurriculo, visualizarCurriculo } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';

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
    // CEI (qualquer outra unidade como Acácias, Araucárias, Imbuias, etc.)
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

export default function VagasPage() {
  const { user } = useAuth();
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');

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
    const data = await fetchVagas(statusFilter, unidadeFilter);
    setVagas(data);
    setLoading(false);
  }, [statusFilter, unidadeFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadVagas();
      }
    });
    return () => {
      active = false;
    };
  }, [loadVagas]);

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
    // Pre-load candidaturas
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

  const handleDownloadCurriculo = async (candidaturaId, nomeArquivo) => {
    await downloadCurriculo(candidaturaId, nomeArquivo);
  };

  const handleVisualizarCurriculo = async (candidaturaId, nomeArquivo) => {
    await visualizarCurriculo(candidaturaId, nomeArquivo);
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
            {user?.nivel === 'suporte' ? (
              <span>Visualizando as vagas de <strong>todas as unidades</strong></span>
            ) : (
              <span>Gerencie as vagas da unidade <strong>{user?.unidade || '—'}</strong></span>
            )}
          </p>
        </div>
        {(user?.nivel === 'diretora' || user?.nivel === 'suporte') && (
          <button className="btn btn--secondary" onClick={handleOpenCreate}>
            + Nova Vaga
          </button>
        )}
      </div>

      {/* Filtros */}
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

      {/* Lista */}
      {loading ? (
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
                📍 {vaga.unidade}
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

      {/* Modal Criar/Editar */}
      {showFormModal && (
        <div className="vagas-modal__overlay" onClick={() => setShowFormModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95%' }}>
            <div className="vagas-modal__header">
              <h2>{editingVaga ? 'Editar Vaga' : 'Nova Vaga'}</h2>
              <button className="vagas-modal__close" onClick={() => setShowFormModal(false)}>✕</button>
            </div>

            <div className="vagas-modal__split-container">
              {/* Left Column: Form Fields */}
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

              {/* Right Column: Live Preview */}
              <div className="vagas-modal__preview-col">
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-gray-500)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Prévia da Exibição Pública
                </h3>

                <div style={{ background: '#fdfdfd', border: '1px solid var(--color-gray-200)', borderRadius: '12px', padding: '16px', pointerEvents: 'none', userSelect: 'none' }}>
                  {/* Simulated Hero */}
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
                      <span>📍 {formData.unidade || user?.unidade || 'Unidade'}</span>
                      <span>💼 {MODALIDADE_LABELS[formData.modalidade]} ({CONTRATO_LABELS[formData.tipoContrato]})</span>
                    </div>
                  </div>

                  {/* Simulated Details Grid */}
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
                  <div className="vagas-detail__actions">
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
                            onClick={() => handleVisualizarCurriculo(cand.id, cand.curriculoNome)}
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
