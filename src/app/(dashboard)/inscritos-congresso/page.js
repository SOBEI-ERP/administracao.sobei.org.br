'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchInscritosCongresso, alterarPresencaInscrito, enviarCertificadoInscrito, downloadCertificadoInscrito } from '@/lib/api';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';
import { IconCheck, IconClose, IconSearch, IconUser, IconMapPin, IconClock } from '@/components/Icons';

export default function InscritosCongressoPage() {
  const { user } = useAuth();
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');
  const [tipoOscFilter, setTipoOscFilter] = useState('');
  const [presencaFiltro, setPresencaFiltro] = useState('');
  const [updatingAction, setUpdatingAction] = useState(null); // 'id-11' ou 'id-12'
  const [enviandoCertId, setEnviandoCertId] = useState(null);
  const [baixandoCertId, setBaixandoCertId] = useState(null);
  const [toastFeedback, setToastFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const nivel = user?.nivel?.toUpperCase();
  const isCoordenadora = nivel === 'COORDENADORA';
  const podeConfirmarPresenca = nivel === 'CREDENCIADOR' || nivel === 'COORDENADORA_EVENTO' || nivel === 'SUPORTE' || nivel === 'DP' || nivel === 'DIRETORA';

  const loadInscritos = useCallback(async () => {
    setLoading(true);
    const data = await fetchInscritosCongresso({
      termo: termoBusca,
      unidade: unidadeFilter,
      tipoOsc: tipoOscFilter,
    });
    setInscritos(data);
    setLoading(false);
  }, [termoBusca, unidadeFilter, tipoOscFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInscritos();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadInscritos]);

  const handleTogglePresenca = async (id, dia, statusAtual) => {
    if (!podeConfirmarPresenca) return;
    const actionKey = `${id}-${dia}`;
    setUpdatingAction(actionKey);
    const novoStatus = !statusAtual;
    const res = await alterarPresencaInscrito(id, dia, novoStatus);
    if (res.success && res.inscricao) {
      setInscritos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...res.inscricao } : item))
      );
    }
    setUpdatingAction(null);
  };

  const handleEnviarCertificado = async (inscrito) => {
    setEnviandoCertId(inscrito.id);
    setToastFeedback(null);
    const res = await enviarCertificadoInscrito(inscrito.id);
    if (res.success) {
      setToastFeedback({
        type: 'success',
        message: `Certificado gerado e enviado com sucesso para ${inscrito.email}!`,
      });
    } else {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao enviar certificado por e-mail.',
      });
    }
    setEnviandoCertId(null);
    setTimeout(() => {
      setToastFeedback((curr) => (curr?.type === 'success' ? null : curr));
    }, 6000);
  };

  const handleBaixarCertificado = async (inscrito) => {
    setBaixandoCertId(inscrito.id);
    const res = await downloadCertificadoInscrito(inscrito.id, inscrito.nomeCompleto);
    if (!res.success) {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao baixar o arquivo do certificado.',
      });
    }
    setBaixandoCertId(null);
  };

  // Contadores
  const total = inscritos.length;
  const presentesDia11 = inscritos.filter((i) => i.presenteDia11).length;
  const presentesDia12 = inscritos.filter((i) => i.presenteDia12).length;
  const sobeiCount = inscritos.filter((i) => i.tipoOsc?.toUpperCase() === 'SOBEI').length;

  const formatHora = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

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

  const unidadesOptions = UNIDADES.map((u) => ({ value: u, label: u }));

  const oscOptions = [
    { value: 'SOBEI', label: 'Apenas SOBEI' },
    { value: 'OUTRA', label: 'Outras OSCs' },
  ];

  const presencaOptions = [
    { value: 'dia11_presente', label: 'Presente no Dia 11 (Sexta)' },
    { value: 'dia12_presente', label: 'Presente no Dia 12 (Sábado)' },
    { value: 'ambos_presente', label: 'Presente em Ambos os Dias' },
    { value: 'nenhum_presente', label: 'Pendente em Ambos os Dias' },
  ];

  // Filtro local de presença
  const inscritosFiltrados = inscritos.filter((item) => {
    if (presencaFiltro === 'dia11_presente') return !!item.presenteDia11;
    if (presencaFiltro === 'dia12_presente') return !!item.presenteDia12;
    if (presencaFiltro === 'ambos_presente') return !!item.presenteDia11 && !!item.presenteDia12;
    if (presencaFiltro === 'nenhum_presente') return !item.presenteDia11 && !item.presenteDia12;
    return true;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="admin-page__title" style={{ margin: 0 }}>
          Congresso de Educação Infantil SOBEI 2026
        </h1>
        <p className="admin-page__description" style={{ marginTop: '6px', marginBottom: 0 }}>
          {isCoordenadora ? (
            <span>Inscritos da unidade <strong>{user?.unidade}</strong></span>
          ) : (
            <span>Gestão completa, credenciamento por dia e emissão de certificados</span>
          )}
        </p>
      </div>

      {/* Toast Feedback Banner */}
      {toastFeedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: toastFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toastFeedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          color: toastFeedback.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.92rem',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toastFeedback.type === 'success' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{toastFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastFeedback(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              display: 'flex',
            }}
          >
            <IconClose size={16} />
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{
          background: '#fff',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderLeft: '4px solid var(--color-primary)'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Inscritos</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-text-dark)', marginTop: '4px' }}>{total}</div>
        </div>

        <div style={{
          background: '#fff',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #10b981'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Check-in Dia 11 (Sexta)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{presentesDia11}</div>
        </div>

        <div style={{
          background: '#fff',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #059669'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Check-in Dia 12 (Sábado)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#059669', marginTop: '4px' }}>{presentesDia12}</div>
        </div>

        {!isCoordenadora && (
          <div style={{
            background: '#fff',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #6366f1'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>SOBEI vs Outras</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#6366f1', marginTop: '6px' }}>
              {sobeiCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--color-text-light)' }}>SOBEI</span> / {total - sobeiCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--color-text-light)' }}>Outras</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca Padrão SOBEI */}
      <div className="filter-bar" style={{ display: 'flex', width: '100%', gap: 'var(--spacing-xl)', flexWrap: 'wrap', alignItems: 'flex-end', padding: 'var(--spacing-md) 0', marginBottom: 'var(--spacing-xl)' }}>
        {/* Input de Busca */}
        <div className="filter-bar__group" style={{ flex: '2', minWidth: '260px' }}>
          <span className="filter-bar__label">Buscar participante:</span>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              style={{
                minHeight: '40px',
                height: '40px',
                padding: '0 36px 0 38px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-gray-300)',
                backgroundColor: 'var(--color-gray-100)',
                fontSize: '14px',
                width: '100%'
              }}
              placeholder="Nome completo ou CPF..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <IconSearch size={15} />
            </span>
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-gray-500)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filtro Status Presença */}
        <div className="filter-bar__group" style={{ flex: '1.2', minWidth: '220px' }}>
          <span className="filter-bar__label">Status de Presença:</span>
          <CustomSelect
            value={presencaFiltro}
            onChange={(val) => setPresencaFiltro(val)}
            defaultOption="Todos os status"
            allowEmpty={true}
            options={presencaOptions}
          />
        </div>

        {/* Filtro Tipo OSC (apenas se não for coordenadora) */}
        {!isCoordenadora && (
          <div className="filter-bar__group" style={{ flex: '1', minWidth: '170px' }}>
            <span className="filter-bar__label">Tipo de OSC:</span>
            <CustomSelect
              value={tipoOscFilter}
              onChange={(val) => setTipoOscFilter(val)}
              defaultOption="Todas as OSCs"
              allowEmpty={true}
              options={oscOptions}
            />
          </div>
        )}

        {/* Filtro Unidade SOBEI (apenas se não for coordenadora) */}
        {!isCoordenadora && (
          <div className="filter-bar__group" style={{ flex: '1.3', minWidth: '210px' }}>
            <span className="filter-bar__label">Unidade SOBEI:</span>
            <CustomSelect
              value={unidadeFilter}
              onChange={(val) => setUnidadeFilter(val)}
              defaultOption="Todas as unidades"
              allowEmpty={true}
              options={unidadesOptions}
            />
          </div>
        )}

        {/* Ação Limpar Filtros */}
        {(termoBusca || unidadeFilter || tipoOscFilter || presencaFiltro) && (
          <div className="filter-bar__actions" style={{ marginLeft: 'auto', alignSelf: 'flex-end', minHeight: '40px' }}>
            <button
              className="btn btn--limpar"
              onClick={() => {
                setTermoBusca('');
                setUnidadeFilter('');
                setTipoOscFilter('');
                setPresencaFiltro('');
              }}
              type="button"
              style={{
                minHeight: '40px',
                height: '40px',
                padding: '0 20px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconClose size={13} />
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista / Tabela de Inscritos */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--border-radius-md)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-light)' }}>
            Carregando inscritos...
          </div>
        ) : inscritosFiltrados.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-light)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Nenhum inscrito encontrado com os filtros aplicados.</p>
            {(termoBusca || unidadeFilter || tipoOscFilter || presencaFiltro) && (
              <button
                onClick={() => {
                  setTermoBusca('');
                  setUnidadeFilter('');
                  setTipoOscFilter('');
                  setPresencaFiltro('');
                }}
                className="btn btn--outline"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px' }}>Participante</th>
                  <th style={{ padding: '14px 18px' }}>CPF</th>
                  <th style={{ padding: '14px 18px' }}>OSC / Unidade</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Presença 11/Set (Sexta)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Presença 12/Set (Sábado)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Emissões &amp; Ações</th>
                  <th style={{ padding: '14px 18px' }}>Data Inscrição</th>
                </tr>
              </thead>
              <tbody>
                {inscritosFiltrados.map((inscrito) => (
                  <tr
                    key={inscrito.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: (inscrito.presenteDia11 || inscrito.presenteDia12) ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                    }}
                  >
                    {/* Nome e Email */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{inscrito.nomeCompleto}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '2px' }}>{inscrito.email}</div>
                    </td>

                    {/* CPF */}
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#374151' }}>
                      {inscrito.cpf}
                    </td>

                    {/* OSC / Unidade */}
                    <td style={{ padding: '14px 18px' }}>
                      {inscrito.tipoOsc === 'SOBEI' ? (
                        <div>
                          <span style={{
                            display: 'inline-block',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '6px'
                          }}>SOBEI</span>
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{inscrito.unidade}</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{
                            display: 'inline-block',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '6px'
                          }}>OUTRA</span>
                          <span style={{ color: '#1f2937' }}>{inscrito.outraOsc}</span>
                        </div>
                      )}
                    </td>

                    {/* Presença Dia 11 (Sexta) */}
                    <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        {inscrito.presenteDia11 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            background: '#d1fae5',
                            color: '#065f46',
                          }}>
                            <IconCheck size={12} /> Presente {formatHora(inscrito.dataPresencaDia11)}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            background: '#f3f4f6',
                            color: '#6b7280',
                          }}>
                            Pendente
                          </span>
                        )}

                        {podeConfirmarPresenca && (
                          <button
                            onClick={() => handleTogglePresenca(inscrito.id, 11, inscrito.presenteDia11)}
                            disabled={updatingAction === `${inscrito.id}-11`}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              backgroundColor: inscrito.presenteDia11 ? '#fee2e2' : '#10b981',
                              color: inscrito.presenteDia11 ? '#991b1b' : '#ffffff',
                              opacity: updatingAction === `${inscrito.id}-11` ? 0.6 : 1,
                            }}
                          >
                            {updatingAction === `${inscrito.id}-11`
                              ? '...'
                              : inscrito.presenteDia11
                              ? 'Desmarcar'
                              : 'Check-in 11/Set'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Presença Dia 12 (Sábado) */}
                    <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        {inscrito.presenteDia12 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            background: '#d1fae5',
                            color: '#065f46',
                          }}>
                            <IconCheck size={12} /> Presente {formatHora(inscrito.dataPresencaDia12)}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            background: '#f3f4f6',
                            color: '#6b7280',
                          }}>
                            Pendente
                          </span>
                        )}

                        {podeConfirmarPresenca && (
                          <button
                            onClick={() => handleTogglePresenca(inscrito.id, 12, inscrito.presenteDia12)}
                            disabled={updatingAction === `${inscrito.id}-12`}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              backgroundColor: inscrito.presenteDia12 ? '#fee2e2' : '#059669',
                              color: inscrito.presenteDia12 ? '#991b1b' : '#ffffff',
                              opacity: updatingAction === `${inscrito.id}-12` ? 0.6 : 1,
                            }}
                          >
                            {updatingAction === `${inscrito.id}-12`
                              ? '...'
                              : inscrito.presenteDia12
                              ? 'Desmarcar'
                              : 'Check-in 12/Set'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Emissões & Ações: Gerar Crachá, Enviar Certificado e Baixar Certificado */}
                    <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
                        {/* Botão 1: Enviar Certificado por E-mail */}
                        <button
                          type="button"
                          onClick={() => handleEnviarCertificado(inscrito)}
                          disabled={enviandoCertId === inscrito.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: enviandoCertId === inscrito.id ? 'wait' : 'pointer',
                            border: '1px solid #C7D2FE',
                            backgroundColor: '#EEF2FF',
                            color: '#3730A3',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            opacity: enviandoCertId === inscrito.id ? 0.7 : 1,
                          }}
                          title="Gerar Certificado com Nome e CPF e enviar diretamente no e-mail do participante"
                        >
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                          {enviandoCertId === inscrito.id ? 'Enviando E-mail...' : 'Enviar Certificado'}
                        </button>

                        {/* Botão 2: Baixar / Visualizar Certificado em PDF */}
                        <button
                          type="button"
                          onClick={() => handleBaixarCertificado(inscrito)}
                          disabled={baixandoCertId === inscrito.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: baixandoCertId === inscrito.id ? 'wait' : 'pointer',
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#F9FAFB',
                            color: '#4B5563',
                            transition: 'all 0.2s ease',
                            width: '100%',
                          }}
                          title="Baixar ou visualizar o arquivo PDF do Certificado"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {baixandoCertId === inscrito.id ? 'Gerando...' : 'Baixar Certificado'}
                        </button>
                      </div>
                    </td>

                    {/* Data de Inscrição */}
                    <td style={{ padding: '14px 18px', color: '#6b7280', fontSize: '0.85rem' }}>
                      {formatDate(inscrito.dataInscricao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
