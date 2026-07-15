'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBancoTalentos, fetchTalentosPorVaga, downloadCurriculoTalento, visualizarCurriculoTalento } from '@/lib/api';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';

export default function BancoTalentosPage() {
  const { user } = useAuth();
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unidadeFilter, setUnidadeFilter] = useState('');

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState(null);
  const [talentos, setTalentos] = useState([]);
  const [loadingTalentos, setLoadingTalentos] = useState(false);

  const loadBancos = useCallback(async () => {
    setLoading(true);
    const data = await fetchBancoTalentos(unidadeFilter);
    setBancos(data);
    setLoading(false);
  }, [unidadeFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadBancos();
      }
    });
    return () => {
      active = false;
    };
  }, [loadBancos]);

  const handleOpenDetail = async (banco) => {
    setSelectedBanco(banco);
    setShowDetailModal(true);
    setLoadingTalentos(true);
    const data = await fetchTalentosPorVaga(banco.vagaId);
    setTalentos(data);
    setLoadingTalentos(false);
  };

  const handleDownloadCurriculo = async (talentoId, nomeArquivo) => {
    await downloadCurriculoTalento(talentoId, nomeArquivo);
  };

  const handleVisualizarCurriculo = async (talentoId, nomeArquivo) => {
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
      {/* Header */}
      <div className="vagas-admin__header">
        <div>
          <h1 className="vagas-admin__title">Banco de Talentos</h1>
          <p className="vagas-admin__subtitle">
            {user?.nivel === 'suporte' ? (
              <span>Candidatos arquivados ao fechar vagas de <strong>todas as unidades</strong></span>
            ) : (
              <span>Histórico de candidatos da unidade <strong>{user?.unidade || '—'}</strong></span>
            )}
          </p>
        </div>
      </div>

      {/* Filtro por Unidade para Suporte */}
      {user?.nivel === 'suporte' && (
        <div className="vagas-admin__filters" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
        </div>
      )}

      {/* Lista de Bancos por Vaga */}
      {loading ? (
        <div className="vagas-admin__loading">Carregando bancos de talentos...</div>
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
              onClick={() => handleOpenDetail(banco)}
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
                📍 {banco.vagaUnidade}
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

      {/* Modal de Detalhes dos Talentos */}
      {showDetailModal && selectedBanco && (
        <div className="vagas-modal__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="vagas-modal vagas-modal--detail" onClick={(e) => e.stopPropagation()}>
            <div className="vagas-modal__header">
              <h2>Banco de Talentos — {selectedBanco.vagaTitulo}</h2>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="vagas-modal__tabs">
              <button className="vagas-modal__tab vagas-modal__tab--active">
                Candidatos ({selectedBanco.totalTalentos || 0})
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
                          📧 {talento.email} &nbsp;|&nbsp; 📱 {talento.telefone}
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
                          onClick={() => handleVisualizarCurriculo(talento.id, talento.curriculoNome)}
                          type="button"
                        >
                          👁️ Visualizar
                        </button>
                        <button
                          className="candidatura-card__download"
                          onClick={() => handleDownloadCurriculo(talento.id, talento.curriculoNome)}
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
          </div>
        </div>
      )}
    </div>
  );
}
