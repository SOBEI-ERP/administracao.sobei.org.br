'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchInscritosCongresso,
  alterarPresencaInscrito,
  enviarCertificadoInscrito,
  enviarCertificadosLoteAmbosDias,
  downloadCertificadoInscrito,
  atualizarOficinasInscrito,
  downloadCrachaInscrito,
  downloadCrachasLote,
  deletarInscritoCongresso,
} from '@/lib/api';
import { UNIDADES } from '@/lib/mockData';
import CustomSelect from '@/components/admin/CustomSelect';
import OficinasModal from '@/components/admin/OficinasModal';
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
  const [baixandoCrachaId, setBaixandoCrachaId] = useState(null);
  const [gerandoLoteCrachas, setGerandoLoteCrachas] = useState(false);
  const [enviandoLoteCertificados, setEnviandoLoteCertificados] = useState(false);
  const [showConfirmModalCertificados, setShowConfirmModalCertificados] = useState(false);
  const [selectedInscritoOficinas, setSelectedInscritoOficinas] = useState(null);
  const [inscritoParaExcluir, setInscritoParaExcluir] = useState(null);
  const [deletandoId, setDeletandoId] = useState(null);
  const [toastFeedback, setToastFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const nivel = user?.nivel?.toUpperCase();
  const isCoordenadora = nivel === 'COORDENADORA';
  const isSuporte = nivel === 'SUPORTE';
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

  const handleSalvarOficinas = async (id, data) => {
    const res = await atualizarOficinasInscrito(id, data);
    if (res.success && res.inscricao) {
      setInscritos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...res.inscricao } : item))
      );
      setToastFeedback({
        type: 'success',
        message: `Oficina de ${res.inscricao.nomeCompleto} atualizada com sucesso!`,
      });
      setTimeout(() => {
        setToastFeedback((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
    } else {
      throw new Error(res.message || 'Erro ao atualizar oficina.');
    }
  };

  const handleBaixarCracha = async (inscrito) => {
    setBaixandoCrachaId(inscrito.id);
    const res = await downloadCrachaInscrito(inscrito.id, inscrito.nomeCompleto);
    if (!res.success) {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao baixar o crachá do participante.',
      });
    }
    setBaixandoCrachaId(null);
  };

  const handleBaixarCrachasLote = async () => {
    if (inscritosFiltrados.length === 0) {
      setToastFeedback({
        type: 'error',
        message: 'Nenhum inscrito disponível para gerar crachás com os filtros atuais.',
      });
      return;
    }

    setGerandoLoteCrachas(true);
    const res = await downloadCrachasLote({
      termo: termoBusca,
      unidade: unidadeFilter,
      tipoOsc: tipoOscFilter,
    });

    if (!res.success) {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao gerar folha de crachás.',
      });
    }
    setGerandoLoteCrachas(false);
  };

  const handleDispararCertificadosLote = async () => {
    setShowConfirmModalCertificados(false);
    setEnviandoLoteCertificados(true);
    setToastFeedback(null);

    const res = await enviarCertificadosLoteAmbosDias();
    if (res.success) {
      setToastFeedback({
        type: 'success',
        message: res.message || `${res.totalEnviados} certificados enviados com sucesso!`,
      });
    } else {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao enviar certificados em lote.',
      });
    }

    setEnviandoLoteCertificados(false);
    setTimeout(() => {
      setToastFeedback((curr) => (curr?.type === 'success' ? null : curr));
    }, 8000);
  };

  const handleConfirmarExclusao = async () => {
    if (!inscritoParaExcluir) return;
    setDeletandoId(inscritoParaExcluir.id);
    const res = await deletarInscritoCongresso(inscritoParaExcluir.id);
    if (res.success) {
      setInscritos((prev) => prev.filter((i) => i.id !== inscritoParaExcluir.id));
      setToastFeedback({
        type: 'success',
        message: `Inscrição de ${inscritoParaExcluir.nomeCompleto} excluída com sucesso!`,
      });
      setInscritoParaExcluir(null);
    } else {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao excluir inscrição.',
      });
    }
    setDeletandoId(null);
  };

  // Contadores
  const total = inscritos.length;
  const presentesDia11 = inscritos.filter((i) => i.presenteDia11).length;
  const presentesDia12 = inscritos.filter((i) => i.presenteDia12).length;
  const presentesAmbosDias = inscritos.filter((i) => i.presenteDia11 && i.presenteDia12).length;
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
      <div style={{
        marginBottom: 'var(--spacing-xl)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 className="admin-page__title" style={{ margin: 0 }}>
            Congresso de Educação Infantil SOBEI 2026
          </h1>
          <p className="admin-page__description" style={{ marginTop: '6px', marginBottom: 0 }}>
            {isCoordenadora ? (
              <span>Inscritos da unidade <strong>{user?.unidade}</strong> — Defina as oficinas das suas colaboradoras e emita os crachás padronizados</span>
            ) : (
              <span>Gestão de inscritos, credenciamento, oficinas e emissão de crachás e certificados</span>
            )}
          </p>
        </div>

        {/* Botões de Ação no Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Botão de Ação em Lote: Enviar Certificados para Presentes em Ambos os Dias */}
          <button
            type="button"
            onClick={() => setShowConfirmModalCertificados(true)}
            disabled={enviandoLoteCertificados || presentesAmbosDias === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#1E40AF',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.88rem',
              border: 'none',
              cursor: (enviandoLoteCertificados || presentesAmbosDias === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: (enviandoLoteCertificados || presentesAmbosDias === 0) ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(30, 64, 175, 0.25)',
            }}
            title={
              presentesAmbosDias === 0
                ? 'Nenhum participante possui check-in em ambos os dias (11 e 12/Set)'
                : `Disparar certificados por e-mail para ${presentesAmbosDias} participantes com presença em ambos os dias`
            }
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            {enviandoLoteCertificados ? 'Enviando Certificados...' : `Enviar Certificados (Ambos os Dias: ${presentesAmbosDias})`}
          </button>

          {/* Botão de Ação em Lote: Imprimir Folha de Crachás */}
          <button
            type="button"
            onClick={handleBaixarCrachasLote}
            disabled={gerandoLoteCrachas || inscritosFiltrados.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#0c1b33',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.88rem',
              border: 'none',
              cursor: (gerandoLoteCrachas || inscritosFiltrados.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: (gerandoLoteCrachas || inscritosFiltrados.length === 0) ? 0.6 : 1,
            }}
            title="Gerar PDF com grade de 14 etiquetas por folha (2 colunas x 7 linhas - 33,9 x 101,6 mm no padrão Tilibra TB182 A4)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {gerandoLoteCrachas ? 'Gerando Folha de Etiquetas...' : 'Imprimir Folha de Etiquetas (Tilibra TB182)'}
          </button>
        </div>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Inscritos</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', margin: '2px 0 0 0' }}>{total}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-in Dia 11 (Sexta)</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', margin: '2px 0 0 0' }}>{presentesDia11}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-in Dia 12 (Sábado)</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', margin: '2px 0 0 0' }}>{presentesDia12}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-in Ambos os Dias</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 'var(--font-weight-bold)', color: '#0284C7', margin: '2px 0 0 0' }}>{presentesAmbosDias}</p>
        </div>

        {!isCoordenadora && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-gray-200)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SOBEI vs Outras</span>
            <p style={{ fontSize: '1.35rem', fontWeight: 'var(--font-weight-bold)', color: '#0284C7', margin: '2px 0 0 0' }}>
              {sobeiCount} <span style={{ fontSize: '0.72rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)' }}>SOBEI</span>{' '}
              <span style={{ color: 'var(--color-gray-300)', margin: '0 3px' }}>/</span>{' '}
              {total - sobeiCount} <span style={{ fontSize: '0.72rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)' }}>Outras</span>
            </p>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca Padrão SOBEI */}
      <div className="filter-bar" style={{ display: 'flex', width: '100%', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', padding: 'var(--spacing-md) 0', marginBottom: 'var(--spacing-lg)' }}>
        {/* Input de Busca */}
        <div className="filter-bar__group" style={{ flex: '1.8', minWidth: '200px' }}>
          <span className="filter-bar__label">Buscar participante:</span>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              style={{
                minHeight: '38px',
                height: '38px',
                padding: '0 34px 0 36px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-gray-300)',
                backgroundColor: 'var(--color-gray-100)',
                fontSize: '13.5px',
                width: '100%'
              }}
              placeholder="Nome completo ou CPF..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <IconSearch size={15} />
            </span>
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                style={{
                  position: 'absolute',
                  right: '10px',
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
        <div className="filter-bar__group" style={{ flex: '1.2', minWidth: '180px' }}>
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
          <div className="filter-bar__group" style={{ flex: '1', minWidth: '150px' }}>
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
          <div className="filter-bar__group" style={{ flex: '1.3', minWidth: '170px' }}>
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
          <div className="filter-bar__actions" style={{ marginLeft: 'auto', alignSelf: 'flex-end', minHeight: '38px' }}>
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
                minHeight: '38px',
                height: '38px',
                padding: '0 16px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
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
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-gray-200)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        width: '100%'
      }}>
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
            Carregando inscritos...
          </div>
        ) : inscritosFiltrados.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
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
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '22%' }}>Participante</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', width: '13%' }}>CPF</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', width: '14%' }}>OSC / Unidade</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '25%' }}>Oficina Pedagógica</th>
                  <th style={{ padding: '12px 6px', textAlign: 'center', width: '12%' }}>Presença 11/Set</th>
                  <th style={{ padding: '12px 6px', textAlign: 'center', width: '12%' }}>Presença 12/Set</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', width: '14%' }}>Emissões &amp; Ações</th>
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
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#111827', wordBreak: 'break-word' }}>{inscrito.nomeCompleto}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.80rem', marginTop: '2px', wordBreak: 'break-all' }}>{inscrito.email}</div>
                    </td>

                    {/* CPF */}
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {inscrito.cpf}
                    </td>

                    {/* OSC / Unidade */}
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {inscrito.tipoOsc === 'SOBEI' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#1B1464',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>SOBEI</span>
                          <span style={{ color: '#1f2937', fontWeight: '500', fontSize: '0.82rem' }}>{inscrito.unidade}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#D97706',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>OUTRA</span>
                          <span style={{ color: '#1f2937', fontSize: '0.82rem' }}>{inscrito.outraOsc}</span>
                        </div>
                      )}
                    </td>

                    {/* Oficina Pedagógica Única */}
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {(inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde) ? (
                          <span
                            style={{
                              color: '#0f766e',
                              fontWeight: '600',
                              fontSize: '0.80rem',
                              lineHeight: '1.25',
                              maxWidth: '240px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                            }}
                            title={inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde}
                          >
                            {inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.78rem' }}>Não definida</span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedInscritoOficinas(inscrito)}
                          style={{
                            alignSelf: 'center',
                            marginTop: '2px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            fontWeight: '700',
                            backgroundColor: (inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde) ? '#059669' : '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          {(inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde) ? 'Editar Oficina' : 'Definir Oficina'}
                        </button>
                      </div>
                    </td>

                    {/* Presença Dia 11 (Sexta) */}
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {inscrito.presenteDia11 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: '#10B981',
                            color: '#FFFFFF',
                          }}>
                            <IconCheck size={12} /> Presente {formatHora(inscrito.dataPresencaDia11)}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: '#6B7280',
                            color: '#FFFFFF',
                          }}>
                            Pendente
                          </span>
                        )}

                        {podeConfirmarPresenca && (
                          <button
                            onClick={() => handleTogglePresenca(inscrito.id, 11, inscrito.presenteDia11)}
                            disabled={updatingAction === `${inscrito.id}-11`}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              backgroundColor: inscrito.presenteDia11 ? '#DC2626' : '#059669',
                              color: '#FFFFFF',
                              opacity: updatingAction === `${inscrito.id}-11` ? 0.7 : 1,
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
                    <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {inscrito.presenteDia12 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: '#10B981',
                            color: '#FFFFFF',
                          }}>
                            <IconCheck size={12} /> Presente {formatHora(inscrito.dataPresencaDia12)}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: '#6B7280',
                            color: '#FFFFFF',
                          }}>
                            Pendente
                          </span>
                        )}

                        {podeConfirmarPresenca && (
                          <button
                            onClick={() => handleTogglePresenca(inscrito.id, 12, inscrito.presenteDia12)}
                            disabled={updatingAction === `${inscrito.id}-12`}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              backgroundColor: inscrito.presenteDia12 ? '#DC2626' : '#059669',
                              color: '#FFFFFF',
                              opacity: updatingAction === `${inscrito.id}-12` ? 0.7 : 1,
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

                    {/* Emissões & Ações: Crachá, Enviar Certificado e Baixar Certificado */}
                    <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', width: '100%', maxWidth: '140px' }}>
                        {/* Botão 1: Imprimir Crachá Individual */}
                        <button
                          type="button"
                          onClick={() => handleBaixarCracha(inscrito)}
                          disabled={baixandoCrachaId === inscrito.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: baixandoCrachaId === inscrito.id ? 'wait' : 'pointer',
                            border: 'none',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            opacity: baixandoCrachaId === inscrito.id ? 0.7 : 1,
                          }}
                          title="Gerar PDF do crachá padronizado deste participante"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <circle cx="12" cy="10" r="2" />
                            <path d="M8 16h8" />
                          </svg>
                          {baixandoCrachaId === inscrito.id ? 'Gerando...' : 'Imprimir Crachá'}
                        </button>

                        {/* Botão 2: Enviar Certificado por E-mail */}
                        <button
                          type="button"
                          onClick={() => handleEnviarCertificado(inscrito)}
                          disabled={enviandoCertId === inscrito.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: enviandoCertId === inscrito.id ? 'wait' : 'pointer',
                            border: 'none',
                            backgroundColor: '#0284C7',
                            color: '#FFFFFF',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            opacity: enviandoCertId === inscrito.id ? 0.7 : 1,
                          }}
                          title="Gerar Certificado com Nome e CPF e enviar diretamente no e-mail do participante"
                        >
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                          {enviandoCertId === inscrito.id ? 'Enviando...' : 'Enviar Certificado'}
                        </button>

                        {/* Botão 3: Baixar / Visualizar Certificado em PDF */}
                        <button
                          type="button"
                          onClick={() => handleBaixarCertificado(inscrito)}
                          disabled={baixandoCertId === inscrito.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.70rem',
                            fontWeight: '700',
                            cursor: baixandoCertId === inscrito.id ? 'wait' : 'pointer',
                            border: 'none',
                            backgroundColor: '#4B5563',
                            color: '#FFFFFF',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            opacity: baixandoCertId === inscrito.id ? 0.7 : 1,
                          }}
                          title="Baixar ou visualizar o arquivo PDF do Certificado"
                        >
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {baixandoCertId === inscrito.id ? 'Baixando...' : 'Baixar Certificado'}
                        </button>

                        {/* Botão 4: Excluir Inscrição (Exclusivo para nível Suporte) */}
                        {isSuporte && (
                          <button
                            type="button"
                            onClick={() => setInscritoParaExcluir(inscrito)}
                            disabled={deletandoId === inscrito.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.70rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              marginTop: '2px',
                            }}
                            title="Excluir permanentemente esta inscrição (Acesso exclusivo Suporte)"
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Excluir Inscrição
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Definição de Oficinas */}
      {selectedInscritoOficinas && (
        <OficinasModal
          inscrito={selectedInscritoOficinas}
          inscritos={inscritos}
          onClose={() => setSelectedInscritoOficinas(null)}
          onSave={handleSalvarOficinas}
        />
      )}

      {/* Modal de Confirmação de Disparo em Lote de Certificados */}
      {showConfirmModalCertificados && (
        <div className="modal-overlay" onClick={() => !enviandoLoteCertificados && setShowConfirmModalCertificados(false)} style={{ zIndex: 1200 }}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              padding: '28px 24px',
              borderRadius: '16px',
            }}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => setShowConfirmModalCertificados(false)}
              disabled={enviandoLoteCertificados}
              aria-label="Fechar modal"
            >
              <IconClose size={18} />
            </button>

            {/* Cabeçalho */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <h2 className="modal__title" style={{ margin: 0, fontSize: '1.25rem' }}>
                Disparar Certificados por E-mail
              </h2>
              <p className="admin-page__description" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                Confirmação de envio automático em lote
              </p>
            </div>

            {/* Linha divisória sutil */}
            <div style={{ height: '1px', backgroundColor: 'var(--color-gray-200)', marginBottom: '18px' }} />

            {/* Corpo formatado */}
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-gray-700)', lineHeight: '1.5', margin: 0 }}>
                Deseja confirmar o disparo do <strong>Certificado Oficial de Participação</strong> para os participantes que compareceram em ambos os dias do evento?
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: '8px',
                border: '1px solid var(--color-gray-200)',
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-gray-600)', fontWeight: '500' }}>
                  Destinatários elegíveis:
                </span>
                <span style={{
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  color: 'var(--color-primary)',
                }}>
                  {presentesAmbosDias} {presentesAmbosDias === 1 ? 'participante' : 'participantes'}
                </span>
              </div>

              <p style={{ fontSize: '0.80rem', color: 'var(--color-gray-500)', margin: 0, lineHeight: '1.4' }}>
                * O certificado em anexo será enviado apenas a quem possui check-in em <strong>11/Set</strong> e <strong>12/Set</strong>.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setShowConfirmModalCertificados(false)}
                disabled={enviandoLoteCertificados}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleDispararCertificadosLote}
                disabled={enviandoLoteCertificados}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {enviandoLoteCertificados ? 'Enviando Certificados...' : 'Confirmar e Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Inscrito (Suporte) */}
      {inscritoParaExcluir && (
        <div className="modal-overlay" onClick={() => !deletandoId && setInscritoParaExcluir(null)} style={{ zIndex: 1200 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <button
              className="modal__close"
              onClick={() => !deletandoId && setInscritoParaExcluir(null)}
              type="button"
              disabled={deletandoId}
              style={{ color: '#0F172A' }}
            >
              <IconClose size={16} />
            </button>
            <h2 className="modal__title" style={{ color: 'var(--color-gray-900)', textAlign: 'center', marginBottom: '14px' }}>
              Excluir Inscrição
            </h2>
            <p style={{ textAlign: 'center', color: '#4B5563', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Tem certeza que deseja excluir permanentemente a inscrição de <strong>{inscritoParaExcluir.nomeCompleto}</strong> (CPF: {inscritoParaExcluir.cpf})?
            </p>
            <p style={{ textAlign: 'center', color: '#DC2626', fontSize: '0.80rem', fontWeight: '600', margin: '0 0 20px 0' }}>
              ⚠️ Esta ação é irreversível e liberará a vaga ocupada no Congresso.
            </p>
            <div className="modal__actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setInscritoParaExcluir(null)}
                disabled={deletandoId}
                style={{ minHeight: '40px', padding: '8px 20px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleConfirmarExclusao}
                disabled={deletandoId}
                style={{
                  minHeight: '40px',
                  padding: '8px 22px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '35px',
                  cursor: deletandoId ? 'wait' : 'pointer',
                }}
              >
                {deletandoId ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
