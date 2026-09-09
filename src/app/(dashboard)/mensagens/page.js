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
          <h1 className="vagas-admin__title" style={{ margin: 0 }}>Mensagens da Unidade</h1>
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
          >
            <span>Não Lidas</span>
            {naoLidasCount > 0 && (
              <span className="vagas-admin__filter-badge">
                {naoLidasCount}
              </span>
            )}
          </button>
        </div>

        {(user?.nivel?.toLowerCase() === 'suporte' || user?.nivel?.toLowerCase() === 'coordenadora_evento') && (
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
                border: '1px solid var(--color-gray-200, #e2e8f0)',
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
                      className="btn--whatsapp btn--sm"
                    >
                      <IconWhatsApp size={16} /> WhatsApp
                    </a>
                  )}

                  {!msg.lida && (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={(e) => handleMarcarComoLida(e, msg.id)}
                    >
                      <IconCheck size={14} /> Marcar Lida
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-icon-danger-outline btn-icon-danger-outline--sm"
                    onClick={(e) => handleOpenDelete(e, msg.id)}
                    title="Excluir mensagem"
                  >
                    <IconTrash size={16} />
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
          <div className="vagas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="vagas-modal__header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  Detalhes da Mensagem
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                  Recebida em {formatDate(selectedMensagem.dataEnvio)}
                </span>
              </div>
              <button className="vagas-modal__close" onClick={() => setShowDetailModal(false)}><IconClose size={18} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--color-gray-50, #f8fafc)', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-gray-500, #64748b)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-gray-900, #0f172a)' }}>{selectedMensagem.nomeCompleto}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-gray-500, #64748b)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>E-mail</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-gray-700, #334155)' }}>{selectedMensagem.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-gray-500, #64748b)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Telefone</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-gray-700, #334155)' }}>{selectedMensagem.telefone || 'Não informado'}</span>
                </div>
              </div>

              <div>
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
                  className="btn btn--danger btn--sm"
                  onClick={(e) => handleOpenDelete(e, selectedMensagem.id)}
                >
                  <IconTrash size={14} /> Excluir Mensagem
                </button>

                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
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
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
