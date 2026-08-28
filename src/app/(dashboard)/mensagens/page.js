'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMensagensUnidade, marcarMensagemComoLida, deletarMensagemUnidade } from '@/lib/api';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';
import { IconMapPin, IconClock, IconMail, IconPhone, IconChat, IconWhatsApp, IconCheck, IconTrash, IconClose, IconWarning } from '@/components/Icons';

export default function MensagensPage() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
  const [unidadeFilter, setUnidadeFilter] = useState('');

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMensagem, setSelectedMensagem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMensagens = useCallback(async () => {
    setLoading(true);
    const data = await fetchMensagensUnidade(unidadeFilter, apenasNaoLidas);
    setMensagens(data);
    setLoading(false);
  }, [unidadeFilter, apenasNaoLidas]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadMensagens();
      }
    });
    return () => {
      active = false;
    };
  }, [loadMensagens]);

  const handleOpenDetail = async (msg) => {
    setSelectedMensagem(msg);
    setShowDetailModal(true);
    if (!msg.lida) {
      const res = await marcarMensagemComoLida(msg.id);
      if (res.success) {
        setSelectedMensagem({ ...msg, lida: true });
        setMensagens((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, lida: true } : m))
        );
      }
    }
  };

  const handleMarcarComoLida = async (e, id) => {
    e.stopPropagation();
    const res = await marcarMensagemComoLida(id);
    if (res.success) {
      setMensagens((prev) =>
        prev.map((m) => (m.id === id ? { ...m, lida: true } : m))
      );
      if (selectedMensagem && selectedMensagem.id === id) {
        setSelectedMensagem({ ...selectedMensagem, lida: true });
      }
    }
  };

  const handleOpenDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await deletarMensagemUnidade(deletingId);
    if (res.success) {
      setMensagens((prev) => prev.filter((m) => m.id !== deletingId));
      if (selectedMensagem && selectedMensagem.id === deletingId) {
        setShowDetailModal(false);
        setSelectedMensagem(null);
      }
      setShowDeleteModal(false);
      setDeletingId(null);
    }
    setDeleting(false);
  };

  const cleanPhone = (phone) => (phone ? phone.replace(/\D/g, '') : '');
  const getWhatsappLink = (phone) => `https://wa.me/55${cleanPhone(phone)}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const naoLidasCount = mensagens.filter((m) => !m.lida).length;

  return (
    <div className="vagas-admin">
      {/* Header */}
      <div className="vagas-admin__header" style={{ flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 className="vagas-admin__title">Mensagens da Unidade</h1>
          <p className="vagas-admin__subtitle">
            {user?.nivel === 'suporte' ? (
              <span>Visualizando mensagens enviadas para <strong>todas as unidades</strong></span>
            ) : (
              <span>Mensagens enviadas para a unidade <strong>{user?.unidade || '—'}</strong></span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="vagas-admin__filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`vagas-admin__filter-btn ${!apenasNaoLidas ? 'vagas-admin__filter-btn--active' : ''}`}
            onClick={() => setApenasNaoLidas(false)}
          >
            Todas ({mensagens.length})
          </button>
          <button
            className={`vagas-admin__filter-btn ${apenasNaoLidas ? 'vagas-admin__filter-btn--active' : ''}`}
            onClick={() => setApenasNaoLidas(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Não Lidas</span>
            {naoLidasCount > 0 && (
              <span style={{ 
                backgroundColor: 'var(--color-primary, #1b1464)', 
                color: '#fff', 
                borderRadius: '10px', 
                padding: '2px 6px', 
                fontSize: '11px',
                fontWeight: 'bold' 
              }}>
                {naoLidasCount}
              </span>
            )}
          </button>
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

      {/* Lista de Mensagens */}
      {loading ? (
        <div className="vagas-admin__loading">Carregando mensagens...</div>
      ) : mensagens.length === 0 ? (
        <div className="vagas-admin__empty">
          <p>Nenhuma mensagem recebida.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              onClick={() => handleOpenDetail(msg)}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: msg.lida ? '1px solid var(--color-gray-200, #e2e8f0)' : '2px solid var(--color-primary, #1b1464)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Header do Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!msg.lida ? (
                    <span style={{
                      backgroundColor: 'var(--color-primary, #1b1464)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Nova
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'var(--color-gray-200, #e2e8f0)',
                      color: 'var(--color-gray-600, #64748b)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Lida
                    </span>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-gray-800, #1e293b)' }}>
                    <IconMapPin size={14} /> {msg.unidade}
                  </span>
                </div>

                <span style={{ fontSize: '12px', color: 'var(--color-gray-500, #64748b)' }}>
                  <IconClock size={12} /> {formatDate(msg.dataEnvio)}
                </span>
              </div>

              {/* Informações do Remetente */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed var(--color-gray-200, #e2e8f0)' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-gray-900, #0f172a)', margin: '0 0 4px 0' }}>
                    {msg.nomeCompleto}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-gray-600, #475569)' }}>
                    <span><IconMail size={13} /> {msg.email}</span>
                    <span><IconPhone size={13} /> {msg.telefone}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {msg.telefone && (
                    <a
                      href={getWhatsappLink(msg.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: '#25D366',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <IconWhatsApp size={16} /> WhatsApp
                    </a>
                  )}

                  {!msg.lida && (
                    <button
                      type="button"
                      onClick={(e) => handleMarcarComoLida(e, msg.id)}
                      style={{
                        backgroundColor: 'var(--color-gray-100, #f1f5f9)',
                        color: 'var(--color-gray-700, #334155)',
                        border: '1px solid var(--color-gray-300, #cbd5e1)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <IconCheck size={14} /> Marcar Lida
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleOpenDelete(e, msg.id)}
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

              {/* Trecho da Mensagem */}
              <p style={{ 
                fontSize: '14px', 
                lineHeight: '1.6', 
                color: 'var(--color-gray-700, #334155)', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {msg.mensagem}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes da Mensagem */}
      {showDetailModal && selectedMensagem && (
        <div className="vagas-modal__overlay" onClick={() => setShowDetailModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
            <div className="vagas-modal__header">
              <h2>Mensagem — {selectedMensagem.unidade}</h2>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}><IconClose size={18} /></button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-gray-900, #0f172a)', margin: '0 0 6px 0' }}>
                    {selectedMensagem.nomeCompleto}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-gray-600, #475569)', margin: '0 0 4px 0' }}>
                    <IconMail size={14} /> <strong>E-mail:</strong> {selectedMensagem.email}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--color-gray-600, #475569)', margin: 0 }}>
                    <IconPhone size={14} /> <strong>Telefone/WhatsApp:</strong> {selectedMensagem.telefone}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-500, #64748b)', display: 'block', marginBottom: '8px' }}>
                    {formatDate(selectedMensagem.dataEnvio)}
                  </span>
                  {selectedMensagem.telefone && (
                    <a
                      href={getWhatsappLink(selectedMensagem.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <IconWhatsApp size={16} /> Abrir WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--color-gray-200, #e2e8f0)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-gray-500, #64748b)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Conteúdo da Mensagem
                </h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-gray-800, #1e293b)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {selectedMensagem.mensagem}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => handleOpenDelete(e, selectedMensagem.id)}
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
                  <IconTrash size={14} /> Excluir Mensagem
                </button>

                <button
                  type="button"
                  className="vagas-form__btn-submit"
                  onClick={() => setShowDetailModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="vagas-modal__overlay" style={{ zIndex: 1100 }} onClick={() => setShowDeleteModal(false)}>
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <IconWarning size={42} style={{ color: '#f59e0b' }} />
              <h2 style={{ fontSize: '20px', color: '#111827', marginTop: '8px', marginBottom: '4px' }}>Excluir Mensagem?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Tem certeza que deseja excluir permanentemente esta mensagem?
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
