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

  const handleSalvarOficinas = async (id, data) => {
    const res = await atualizarOficinasInscrito(id, data);
    if (res.success && res.inscricao) {
      setInscritos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...res.inscricao } : item))
      );
      setToastFeedback({
        type: 'success',
        message: `Oficinas de ${res.inscricao.nomeCompleto} atualizadas com sucesso!`,
      });
      setTimeout(() => {
        setToastFeedback((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
    } else {
      throw new Error(res.message || 'Erro ao atualizar oficinas.');
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
              backgroundColor: '#7C3AED',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.88rem',
              border: 'none',
              cursor: (enviandoLoteCertificados || presentesAmbosDias === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: (enviandoLoteCertificados || presentesAmbosDias === 0) ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(124, 58, 237, 0.25)',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-base)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Inscritos</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', margin: 'var(--spacing-xs) 0 0 0' }}>{total}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-in Dia 11 (Sexta)</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', margin: 'var(--spacing-xs) 0 0 0' }}>{presentesDia11}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gray-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-in Dia 12 (Sábado)</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-green)', margin: 'var(--spacing-xs) 0 0 0' }}>{presentesDia12}</p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #C4B5FD',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-in Ambos os Dias</span>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#7C3AED', margin: 'var(--spacing-xs) 0 0 0' }}>{presentesAmbosDias}</p>
        </div>

        {!isCoordenadora && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-gray-200)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SOBEI vs Outras</span>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-purple)', margin: 'var(--spacing-xs) 0 0 0' }}>
              {sobeiCount} <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)' }}>SOBEI</span>{' '}
              <span style={{ color: 'var(--color-gray-300)', margin: '0 4px' }}>/</span>{' '}
              {total - sobeiCount} <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)' }}>Outras</span>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 12px' }}>Participante</th>
                  <th style={{ padding: '12px 10px', width: '125px' }}>CPF</th>
                  <th style={{ padding: '12px 10px', width: '130px' }}>OSC / Unidade</th>
                  <th style={{ padding: '12px 10px', width: '180px' }}>Oficinas Pedagógicas</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '140px' }}>Presença 11/Set</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '140px' }}>Presença 12/Set</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '150px' }}>Emissões &amp; Ações</th>
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
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#111827', wordBreak: 'break-word' }}>{inscrito.nomeCompleto}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.80rem', marginTop: '2px', wordBreak: 'break-all' }}>{inscrito.email}</div>
                    </td>

                    {/* CPF */}
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap' }}>
                      {inscrito.cpf}
                    </td>

                    {/* OSC / Unidade */}
                    <td style={{ padding: '12px 10px' }}>
                      {inscrito.tipoOsc === 'SOBEI' ? (
                        <div>
                          <span style={{
                            display: 'inline-block',
                            background: '#1B1464',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '4px'
                          }}>SOBEI</span>
                          <span style={{ color: '#1f2937', fontWeight: '500', fontSize: '0.82rem' }}>{inscrito.unidade}</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{
                            display: 'inline-block',
                            background: '#D97706',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '4px'
                          }}>OUTRA</span>
                          <span style={{ color: '#1f2937', fontSize: '0.82rem' }}>{inscrito.outraOsc}</span>
                        </div>
                      )}
                    </td>

                    {/* Oficinas Pedagógicas (Manhã e Tarde) */}
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.76rem', color: '#374151' }}>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>M:</span>{' '}
                          {inscrito.oficinaManha ? (
                            <span style={{ color: '#0f766e', fontWeight: '600' }}>{inscrito.oficinaManha}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Não definida</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#374151' }}>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>T:</span>{' '}
                          {inscrito.oficinaTarde ? (
                            <span style={{ color: '#0f766e', fontWeight: '600' }}>{inscrito.oficinaTarde}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Não definida</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInscritoOficinas(inscrito)}
                          style={{
                            alignSelf: 'flex-start',
                            marginTop: '2px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            fontWeight: '700',
                            backgroundColor: (inscrito.oficinaManha || inscrito.oficinaTarde) ? '#059669' : '#2563EB',
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
                          {(inscrito.oficinaManha || inscrito.oficinaTarde) ? 'Editar Oficinas' : 'Definir Oficinas'}
                        </button>
                      </div>
                    </td>

                    {/* Presença Dia 11 (Sexta) */}
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                            backgroundColor: '#7C3AED',
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
          onClose={() => setSelectedInscritoOficinas(null)}
          onSave={handleSalvarOficinas}
        />
      )}

      {/* Modal de Confirmação de Disparo em Lote de Certificados */}
      {showConfirmModalCertificados && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 63, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#F5F3FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>
                  Disparar Certificados por E-mail
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  Apenas para participantes com 100% de presença
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: '500' }}>Critério de Elegibilidade:</span>
                <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: '700' }}>Presença em 11/Set e 12/Set</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: '500' }}>Total de Participantes Aptos:</span>
                <span style={{ fontSize: '0.95rem', color: '#7C3AED', fontWeight: '800' }}>{presentesAmbosDias} inscrito(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: '500' }}>Formato:</span>
                <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: '600' }}>PDF Oficial + Resend SMTP</span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.5', margin: '0 0 24px' }}>
              Deseja confirmar o disparo automático do Certificado Oficial de Participação por e-mail para todos os <strong>{presentesAmbosDias} participantes</strong> com presença registrada nos dois dias do congresso?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModalCertificados(false)}
                disabled={enviandoLoteCertificados}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDispararCertificadosLote}
                disabled={enviandoLoteCertificados}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: enviandoLoteCertificados ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                  opacity: enviandoLoteCertificados ? 0.7 : 1,
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {enviandoLoteCertificados ? 'Enviando Certificados...' : 'Confirmar e Enviar Certificados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
