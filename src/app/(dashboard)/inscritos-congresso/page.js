'use client';

import { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchInscritosCongresso,
  fetchEstatisticasCongresso,
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
import { normalizarNomeUnidade, normalizarTextoOficina } from '@/lib/congressoOficinas';
import CustomSelect from '@/components/admin/CustomSelect';
import OficinasModal from '@/components/admin/OficinasModal';
import { IconCheck, IconClose, IconSearch, IconClock } from '@/components/Icons';

const TAMANHO_PAGINA = 100;

// Formatador único compartilhado (evita instanciar Intl.DateTimeFormat milhares de vezes na renderização)
const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatHoraRapida(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return TIME_FORMATTER.format(d);
}

function normalizarTextoBusca(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function enriquecerInscrito(item) {
  const oficinaEfetiva = item.oficina || item.oficinaManha || item.oficinaTarde || '';
  return {
    ...item,
    _nomeNorm: normalizarTextoBusca(item.nomeCompleto),
    _emailNorm: (item.email || '').toLowerCase().trim(),
    _cpfLower: (item.cpf || '').toLowerCase().trim(),
    _cpfDigits: (item.cpf || '').replace(/\D/g, ''),
    _tipoOscUpper: (item.tipoOsc || '').trim().toUpperCase(),
    _unidadeTrimLower: (item.unidade || '').trim().toLowerCase(),
    _unidadeNorm: normalizarNomeUnidade(item.unidade),
    _oficinaEfetiva: oficinaEfetiva,
    _oficinaNorm: normalizarTextoOficina(oficinaEfetiva),
    _horaDia11: formatHoraRapida(item.dataPresencaDia11),
    _horaDia12: formatHoraRapida(item.dataPresencaDia12),
  };
}

const UNIDADES_OPTIONS = UNIDADES.map((u) => ({ value: u, label: u }));

const OSC_OPTIONS = [
  { value: 'SOBEI', label: 'Apenas SOBEI' },
  { value: 'OUTRA', label: 'Outras OSCs' },
];

const PRESENCA_OPTIONS = [
  { value: 'dia11_presente', label: 'Presente no Dia 11 (Sexta)' },
  { value: 'dia12_presente', label: 'Presente no Dia 12 (Sábado)' },
  { value: 'ambos_presente', label: 'Presente em Ambos os Dias' },
  { value: 'nenhum_presente', label: 'Pendente em Ambos os Dias' },
];

/**
 * Linha individual memoizada para evitar re-renderização das demais linhas
 * durante check-in, download de crachá/certificado ou digitação.
 */
const InscritoRow = memo(function InscritoRow({
  inscrito,
  isCredenciador,
  isSuporte,
  podeConfirmarPresenca,
  updatingDia11,
  updatingDia12,
  baixandoCracha,
  enviandoCert,
  baixandoCert,
  deletando,
  onOpenOficinas,
  onTogglePresenca,
  onBaixarCracha,
  onEnviarCertificado,
  onBaixarCertificado,
  onSolicitarExclusao,
}) {
  const temCheckinAmbosDias = Boolean(inscrito.presenteDia11 && inscrito.presenteDia12);
  const certificadoBloqueadoCredenciador = isCredenciador && !temCheckinAmbosDias;
  const oficinaTexto = inscrito._oficinaEfetiva;
  const hora11 = inscrito._horaDia11;
  const hora12 = inscrito._horaDia12;

  return (
    <tr
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <span style={{
              display: 'inline-block',
              background: '#1B1464',
              color: '#FFFFFF',
              fontSize: '0.70rem',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              lineHeight: '1.2',
            }}>SOBEI</span>
            <span style={{ color: '#1f2937', fontWeight: '500', fontSize: '0.82rem', wordBreak: 'break-word', maxWidth: '140px', lineHeight: '1.2' }}>{inscrito.unidade}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <span style={{
              display: 'inline-block',
              background: '#D97706',
              color: '#FFFFFF',
              fontSize: '0.70rem',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              lineHeight: '1.2',
            }}>OSC</span>
            <span style={{ color: '#1f2937', fontSize: '0.82rem', wordBreak: 'break-word', maxWidth: '140px', lineHeight: '1.2' }}>{inscrito.outraOsc}</span>
          </div>
        )}
      </td>

      {/* Oficina Pedagógica Única */}
      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
          {oficinaTexto ? (
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
              title={oficinaTexto}
            >
              {oficinaTexto}
            </span>
          ) : (
            <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.78rem' }}>Não definida</span>
          )}

          <button
            type="button"
            onClick={() => onOpenOficinas(inscrito)}
            style={{
              alignSelf: 'center',
              marginTop: '2px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.73rem',
              fontWeight: '700',
              backgroundColor: oficinaTexto ? '#059669' : '#2563EB',
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
            {oficinaTexto ? 'Editar Oficina' : 'Definir Oficina'}
          </button>
        </div>
      </td>

      {/* Presença Dia 11 (Sexta) */}
      <td style={{ padding: '4px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle', height: '1px', width: '96px', minWidth: '96px', maxWidth: '96px' }}>
        <button
          type="button"
          onClick={() => podeConfirmarPresenca && onTogglePresenca(inscrito.id, 11, inscrito.presenteDia11)}
          disabled={!podeConfirmarPresenca || updatingDia11}
          className={`checkin-square-btn checkin-square-btn--left ${inscrito.presenteDia11 ? 'checkin-square-btn--presente' : 'checkin-square-btn--pendente'}`}
          title={
            !podeConfirmarPresenca
              ? (inscrito.presenteDia11 ? 'Presença confirmada em 11/Set' : 'Presença pendente em 11/Set')
              : inscrito.presenteDia11
              ? `Presente em 11/Set${hora11 ? ` às ${hora11}` : ''}. Clique para desmarcar`
              : 'Pendente em 11/Set. Clique para confirmar check-in'
          }
        >
          {updatingDia11 ? (
            <div className="checkin-square-btn__loading">
              <span className="checkin-square-btn__spinner" />
              <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>Salvando...</span>
            </div>
          ) : inscrito.presenteDia11 ? (
            <>
              <span className="checkin-square-btn__day">11/Set</span>
              <div className="checkin-square-btn__content-default">
                <IconCheck size={18} strokeWidth={2.8} />
                <span className="checkin-square-btn__status">Presente</span>
                {hora11 && (
                  <span className="checkin-square-btn__time">{hora11}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="checkin-square-btn__day">11/Set</span>
              <div className="checkin-square-btn__content-default">
                <IconClock size={16} />
                <span className="checkin-square-btn__status">Pendente</span>
              </div>
            </>
          )}
        </button>
      </td>

      {/* Presença Dia 12 (Sábado) */}
      <td style={{ padding: '4px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle', height: '1px', width: '96px', minWidth: '96px', maxWidth: '96px' }}>
        <button
          type="button"
          onClick={() => podeConfirmarPresenca && onTogglePresenca(inscrito.id, 12, inscrito.presenteDia12)}
          disabled={!podeConfirmarPresenca || updatingDia12}
          className={`checkin-square-btn checkin-square-btn--right ${inscrito.presenteDia12 ? 'checkin-square-btn--presente' : 'checkin-square-btn--pendente'}`}
          title={
            !podeConfirmarPresenca
              ? (inscrito.presenteDia12 ? 'Presença confirmada em 12/Set' : 'Presença pendente em 12/Set')
              : inscrito.presenteDia12
              ? `Presente em 12/Set${hora12 ? ` às ${hora12}` : ''}. Clique para desmarcar`
              : 'Pendente em 12/Set. Clique para confirmar check-in'
          }
        >
          {updatingDia12 ? (
            <div className="checkin-square-btn__loading">
              <span className="checkin-square-btn__spinner" />
              <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>Salvando...</span>
            </div>
          ) : inscrito.presenteDia12 ? (
            <>
              <span className="checkin-square-btn__day">12/Set</span>
              <div className="checkin-square-btn__content-default">
                <IconCheck size={18} strokeWidth={2.8} />
                <span className="checkin-square-btn__status">Presente</span>
                {hora12 && (
                  <span className="checkin-square-btn__time">{hora12}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="checkin-square-btn__day">12/Set</span>
              <div className="checkin-square-btn__content-default">
                <IconClock size={16} />
                <span className="checkin-square-btn__status">Pendente</span>
              </div>
            </>
          )}
        </button>
      </td>

      {/* Emissões & Ações: Crachá, Enviar Certificado e Baixar Certificado */}
      <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap', minWidth: '145px' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', width: '100%', maxWidth: '140px' }}>
          {/* Botão 1: Imprimir Crachá Individual */}
          <button
            type="button"
            onClick={() => onBaixarCracha(inscrito)}
            disabled={baixandoCracha}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: baixandoCracha ? 'wait' : 'pointer',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              width: '100%',
              opacity: baixandoCracha ? 0.7 : 1,
            }}
            title="Gerar PDF do crachá padronizado deste participante"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="12" cy="10" r="2" />
              <path d="M8 16h8" />
            </svg>
            {baixandoCracha ? 'Gerando...' : 'Imprimir Crachá'}
          </button>

          {/* Botão 2: Enviar Certificado por E-mail */}
          <button
            type="button"
            onClick={() => onEnviarCertificado(inscrito)}
            disabled={enviandoCert || certificadoBloqueadoCredenciador}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: certificadoBloqueadoCredenciador
                ? 'not-allowed'
                : enviandoCert
                ? 'wait'
                : 'pointer',
              border: 'none',
              backgroundColor: certificadoBloqueadoCredenciador ? '#94A3B8' : '#0284C7',
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              width: '100%',
              opacity: certificadoBloqueadoCredenciador
                ? 0.55
                : enviandoCert
                ? 0.7
                : 1,
            }}
            title={
              certificadoBloqueadoCredenciador
                ? 'Disponível apenas após confirmação de presença (check-in) em ambos os dias (11 e 12/Set)'
                : 'Gerar Certificado com Nome e CPF e enviar diretamente no e-mail do participante'
            }
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            {enviandoCert ? 'Enviando...' : 'Enviar Certificado'}
          </button>

          {/* Botão 3: Baixar / Visualizar Certificado em PDF */}
          <button
            type="button"
            onClick={() => onBaixarCertificado(inscrito)}
            disabled={baixandoCert || certificadoBloqueadoCredenciador}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.70rem',
              fontWeight: '700',
              cursor: certificadoBloqueadoCredenciador
                ? 'not-allowed'
                : baixandoCert
                ? 'wait'
                : 'pointer',
              border: 'none',
              backgroundColor: certificadoBloqueadoCredenciador ? '#94A3B8' : '#4B5563',
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              width: '100%',
              opacity: certificadoBloqueadoCredenciador
                ? 0.55
                : baixandoCert
                ? 0.7
                : 1,
            }}
            title={
              certificadoBloqueadoCredenciador
                ? 'Disponível apenas após confirmação de presença (check-in) em ambos os dias (11 e 12/Set)'
                : 'Baixar ou visualizar o arquivo PDF do Certificado'
            }
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {baixandoCert ? 'Baixando...' : 'Baixar Certificado'}
          </button>

          {/* Botão 4: Excluir Inscrição (Exclusivo para nível Suporte) */}
          {isSuporte && (
            <button
              type="button"
              onClick={() => onSolicitarExclusao(inscrito)}
              disabled={deletando}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.70rem',
                fontWeight: '700',
                cursor: deletando ? 'not-allowed' : 'pointer',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                transition: 'all 0.2s ease',
                width: '100%',
                marginTop: '2px',
                opacity: deletando ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B91C1C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
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
  );
});

export default function InscritosCongressoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [statsGerais, setStatsGerais] = useState(null);

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
  const [toastFeedback, setToastFeedback] = useState(null);

  const sentinelRef = useRef(null);
  const termoBuscaDeferred = useDeferredValue(termoBusca);

  const nivel = user?.nivel?.toUpperCase();
  const isCoordenadora = nivel === 'COORDENADORA';
  const isDiretora = nivel === 'DIRETORA';
  const isGestoraUnidade = isCoordenadora || isDiretora;
  const isSuporte = nivel === 'SUPORTE';
  const isCredenciador = nivel === 'CREDENCIADOR';
  const isCoordenadoraEvento = nivel === 'COORDENADORA_EVENTO';
  const podeConfirmarPresenca = isCredenciador || isCoordenadoraEvento || isSuporte;
  const podeDispararCertificadosLote = isSuporte || isCoordenadoraEvento;

  useEffect(() => {
    if (nivel === 'DP') {
      router.push('/vagas');
    }
  }, [nivel, router]);

  // Carrega as estatísticas consolidadas uma vez na montagem para preencher o card superior
  const loadEstatisticas = useCallback(async () => {
    try {
      const data = await fetchEstatisticasCongresso();
      if (data) {
        setStatsGerais(data);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas do congresso:', err);
    }
  }, []);

  useEffect(() => {
    if (nivel && nivel !== 'DP') {
      loadEstatisticas();
    }
  }, [loadEstatisticas, nivel]);

  // Busca a primeira página de 100 usuários sempre que os filtros mudarem
  const carregarPrimeiraPagina = useCallback(async () => {
    setLoading(true);
    setPagina(0);
    try {
      const res = await fetchInscritosCongresso({
        termo: termoBuscaDeferred,
        unidade: unidadeFilter,
        tipoOsc: tipoOscFilter,
        statusPresenca: presencaFiltro,
        page: 0,
        size: TAMANHO_PAGINA,
      });

      const items = Array.isArray(res) ? res : (res.items || []);
      const enriched = items.map(enriquecerInscrito);
      setInscritos(enriched);
      setTotalRegistros(res.total ?? enriched.length);
      setTemMais(Boolean(res.hasNext ?? (enriched.length >= TAMANHO_PAGINA)));
    } catch (err) {
      console.error('Erro ao carregar primeira página de inscritos:', err);
    } finally {
      setLoading(false);
    }
  }, [termoBuscaDeferred, unidadeFilter, tipoOscFilter, presencaFiltro]);

  useEffect(() => {
    if (nivel && nivel !== 'DP') {
      const timer = setTimeout(() => {
        carregarPrimeiraPagina();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [carregarPrimeiraPagina, nivel]);

  // Busca a próxima página de 100 usuários e anexa à lista existente
  const carregarMais = useCallback(async () => {
    if (loading || loadingMore || !temMais) return;
    setLoadingMore(true);
    const proximaPagina = pagina + 1;

    try {
      const res = await fetchInscritosCongresso({
        termo: termoBuscaDeferred,
        unidade: unidadeFilter,
        tipoOsc: tipoOscFilter,
        statusPresenca: presencaFiltro,
        page: proximaPagina,
        size: TAMANHO_PAGINA,
      });

      const items = Array.isArray(res) ? res : (res.items || []);
      const novosEnriquecidos = items.map(enriquecerInscrito);

      setInscritos((prev) => {
        const idsExistentes = new Set(prev.map((i) => i.id));
        const unicos = novosEnriquecidos.filter((i) => !idsExistentes.has(i.id));
        return [...prev, ...unicos];
      });

      setPagina(proximaPagina);
      setTotalRegistros(res.total ?? (inscritos.length + novosEnriquecidos.length));
      setTemMais(Boolean(res.hasNext ?? (novosEnriquecidos.length >= TAMANHO_PAGINA)));
    } catch (err) {
      console.error('Erro ao carregar mais participantes:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, temMais, pagina, termoBuscaDeferred, unidadeFilter, tipoOscFilter, presencaFiltro, inscritos.length]);

  // IntersectionObserver no sentinel para auto-carregamento ao chegar no fim
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !temMais || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          carregarMais();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [temMais, loading, loadingMore, carregarMais]);

  const handleTogglePresenca = useCallback(async (id, dia, statusAtual) => {
    if (!podeConfirmarPresenca) return;
    const actionKey = `${id}-${dia}`;
    setUpdatingAction(actionKey);
    const novoStatus = !statusAtual;
    const res = await alterarPresencaInscrito(id, dia, novoStatus);
    if (res.success && res.inscricao) {
      setInscritos((prev) =>
        prev.map((item) => (item.id === id ? enriquecerInscrito({ ...item, ...res.inscricao }) : item))
      );
      // Atualiza levemente os contadores das estatísticas gerais
      setStatsGerais((prev) => {
        if (!prev) return prev;
        const diff = novoStatus ? 1 : -1;
        if (dia === 11) {
          return { ...prev, presentesDia11: Math.max(0, (prev.presentesDia11 || 0) + diff) };
        }
        if (dia === 12) {
          return { ...prev, presentesDia12: Math.max(0, (prev.presentesDia12 || 0) + diff) };
        }
        return prev;
      });
    }
    setUpdatingAction(null);
  }, [podeConfirmarPresenca]);

  const handleEnviarCertificado = useCallback(async (inscrito) => {
    if (isCredenciador && (!inscrito.presenteDia11 || !inscrito.presenteDia12)) {
      setToastFeedback({
        type: 'error',
        message: 'Para usuários credenciadores, o envio de certificado só é permitido após check-in em ambos os dias (11 e 12/Set).',
      });
      return;
    }
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
  }, [isCredenciador]);

  const handleBaixarCertificado = useCallback(async (inscrito) => {
    if (isCredenciador && (!inscrito.presenteDia11 || !inscrito.presenteDia12)) {
      setToastFeedback({
        type: 'error',
        message: 'Para usuários credenciadores, o download de certificado só é permitido após check-in em ambos os dias (11 e 12/Set).',
      });
      return;
    }
    setBaixandoCertId(inscrito.id);
    const res = await downloadCertificadoInscrito(inscrito.id, inscrito.nomeCompleto);
    if (!res.success) {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao baixar o arquivo do certificado.',
      });
    }
    setBaixandoCertId(null);
  }, [isCredenciador]);

  const handleSalvarOficinas = useCallback(async (id, data) => {
    const res = await atualizarOficinasInscrito(id, data);
    if (res.success && res.inscricao) {
      setInscritos((prev) =>
        prev.map((item) => (item.id === id ? enriquecerInscrito({ ...item, ...res.inscricao }) : item))
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
  }, []);

  const handleBaixarCracha = useCallback(async (inscrito) => {
    setBaixandoCrachaId(inscrito.id);
    const res = await downloadCrachaInscrito(inscrito.id, inscrito.nomeCompleto);
    if (!res.success) {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao baixar o crachá do participante.',
      });
    }
    setBaixandoCrachaId(null);
  }, []);

  const handleBaixarCrachasLote = async () => {
    if (inscritos.length === 0) {
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
      setTotalRegistros((prev) => Math.max(0, prev - 1));
      setToastFeedback({
        type: 'success',
        message: `Inscrição de ${inscritoParaExcluir.nomeCompleto} excluída com sucesso!`,
      });
      setInscritoParaExcluir(null);
      loadEstatisticas();
    } else {
      setToastFeedback({
        type: 'error',
        message: res.message || 'Erro ao excluir inscrição.',
      });
    }
    setDeletandoId(null);
  };

  if (nivel === 'DP') {
    return null;
  }

  const temFiltroAtivo = Boolean(termoBusca || unidadeFilter || tipoOscFilter || presencaFiltro);

  // Métricas do card superior: reflete dados oficiais de Estatisticas ou contadores reais
  const metricasCard = {
    total: statsGerais?.totalInscritos ?? totalRegistros,
    presentesDia11: statsGerais?.presentesDia11 ?? 0,
    presentesDia12: statsGerais?.presentesDia12 ?? 0,
    presentesAmbosDias: statsGerais?.presentesAmbosDias ?? 0,
    sobeiCount: statsGerais?.totalSobei ?? 0,
    outraCount: statsGerais?.totalOutrasOsc ?? 0,
  };

  return (
    <div className="admin-page">
      {/* Título da Página */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', margin: '0 0 var(--spacing-md) 0' }}>
        <h1 className="admin-page__title" style={{ margin: 0 }}>
          Congresso
        </h1>
        {isGestoraUnidade && user?.unidade && (
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            backgroundColor: '#EEF2FF',
            color: 'var(--color-primary, #1b1464)',
            padding: '5px 12px',
            borderRadius: '16px',
            border: '1px solid #C7D2FE',
          }}>
            Unidade: {user.unidade}
          </span>
        )}
      </div>

      {/* Toast Feedback Banner */}
      {toastFeedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: 'var(--spacing-md)',
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

      {/* Barra de Filtros e Busca Padrão SOBEI */}
      <div className="filter-bar" style={{ display: 'flex', width: '100%', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '0 0 var(--spacing-sm) 0', marginBottom: '12px' }}>
        {/* Input de Busca */}
        <div className="filter-bar__group" style={{ flex: '1.8', minWidth: '200px' }}>
          <span className="filter-bar__label">Buscar participante:</span>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input filter-bar__input"
              style={{
                minHeight: '38px',
                height: '38px',
                padding: '0 34px 0 36px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-white)',
                fontSize: '13.5px',
                width: '100%',
              }}
              placeholder="Nome completo, e-mail ou CPF..."
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
            options={PRESENCA_OPTIONS}
          />
        </div>

        {/* Filtro Tipo OSC (apenas para administradores gerais do evento) */}
        {!isGestoraUnidade && (
          <div className="filter-bar__group" style={{ flex: '1', minWidth: '150px' }}>
            <span className="filter-bar__label">Tipo de OSC:</span>
            <CustomSelect
              value={tipoOscFilter}
              onChange={(val) => setTipoOscFilter(val)}
              defaultOption="Todas as OSCs"
              allowEmpty={true}
              options={OSC_OPTIONS}
            />
          </div>
        )}

        {/* Filtro Unidade SOBEI (apenas para administradores gerais do evento) */}
        {!isGestoraUnidade && (
          <div className="filter-bar__group" style={{ flex: '1.3', minWidth: '170px' }}>
            <span className="filter-bar__label">Unidade SOBEI:</span>
            <CustomSelect
              value={unidadeFilter}
              onChange={(val) => setUnidadeFilter(val)}
              defaultOption="Todas as unidades"
              allowEmpty={true}
              options={UNIDADES_OPTIONS}
            />
          </div>
        )}

        {/* Ação Limpar Filtros */}
        {temFiltroAtivo && (
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
                fontSize: '0.85rem',
              }}
            >
              <IconClose size={13} />
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Botões de Ação em Lote (Abaixo dos Dropdowns de Filtro) */}
      <div className="congresso-actions-bar">
        {/* Botão de Ação em Lote: Enviar Certificados para Presentes em Ambos os Dias (Restrito a Suporte/Evento) */}
        {podeDispararCertificadosLote && (
          <button
            type="button"
            onClick={() => setShowConfirmModalCertificados(true)}
            disabled={enviandoLoteCertificados || metricasCard.presentesAmbosDias === 0}
            className="congresso-btn btn-certificados"
            style={{
              cursor: (enviandoLoteCertificados || metricasCard.presentesAmbosDias === 0) ? 'not-allowed' : 'pointer',
              opacity: (enviandoLoteCertificados || metricasCard.presentesAmbosDias === 0) ? 0.6 : 1,
            }}
            title={
              metricasCard.presentesAmbosDias === 0
                ? 'Nenhum participante possui check-in em ambos os dias (11 e 12/Set)'
                : `Disparar certificados por e-mail para ${metricasCard.presentesAmbosDias} participantes com presença em ambos os dias`
            }
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            {enviandoLoteCertificados ? 'Enviando Certificados...' : `Enviar Certificados (Ambos os Dias: ${metricasCard.presentesAmbosDias})`}
          </button>
        )}

        {/* Botão de Ação em Lote: Imprimir Folha de Crachás */}
        <button
          type="button"
          onClick={handleBaixarCrachasLote}
          disabled={gerandoLoteCrachas || inscritos.length === 0}
          className="congresso-btn btn-crachas"
          style={{
            cursor: (gerandoLoteCrachas || inscritos.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (gerandoLoteCrachas || inscritos.length === 0) ? 0.6 : 1,
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

      {/* Card Único com Informações e Métricas */}
      <div className="congresso-metrics-card">
        <div className="congresso-metric-item">
          <span className="congresso-metric-label">
            {temFiltroAtivo ? 'Filtro / Total:' : 'Total Inscritos:'}
          </span>
          <span className="congresso-metric-value">
            {temFiltroAtivo ? `${totalRegistros} de ${metricasCard.total}` : metricasCard.total}
          </span>
        </div>

        <div className="congresso-metric-divider-v" />
        <div className="congresso-metric-divider-h" />

        <div className="congresso-metric-item">
          <span className="congresso-metric-label">Check-in Dia 11 (Sexta):</span>
          <span className="congresso-metric-value">{metricasCard.presentesDia11}</span>
        </div>

        <div className="congresso-metric-divider-v" />
        <div className="congresso-metric-divider-h" />

        <div className="congresso-metric-item">
          <span className="congresso-metric-label">Check-in Dia 12 (Sábado):</span>
          <span className="congresso-metric-value">{metricasCard.presentesDia12}</span>
        </div>

        <div className="congresso-metric-divider-v" />
        <div className="congresso-metric-divider-h" />

        <div className="congresso-metric-item">
          <span className="congresso-metric-label">Check-in Ambos os Dias:</span>
          <span className="congresso-metric-value">{metricasCard.presentesAmbosDias}</span>
        </div>

        {!isGestoraUnidade && (
          <>
            <div className="congresso-metric-divider-v" />
            <div className="congresso-metric-divider-h" />
            <div className="congresso-metric-item">
              <span className="congresso-metric-label">SOBEI vs OSC:</span>
              <span className="congresso-metric-value">
                {metricasCard.sobeiCount} <span className="congresso-metric-sublabel">SOBEI</span>{' '}
                <span style={{ color: 'var(--color-gray-300)', margin: '0 2px' }}>/</span>{' '}
                {metricasCard.outraCount} <span className="congresso-metric-sublabel">OSC</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Lista / Tabela de Inscritos */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-gray-200)',
        overflow: 'hidden',
        width: '100%',
      }}>
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
            Carregando participantes (100 por vez)...
          </div>
        ) : inscritos.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Nenhum inscrito encontrado com os filtros aplicados.</p>
            {temFiltroAtivo && (
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
          <>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '22%' }}>Participante</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '13%' }}>CPF</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '14%' }}>OSC / Unidade</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '23%' }}>Oficina Pedagógica</th>
                    <th style={{ padding: '12px 4px', textAlign: 'center', width: '96px', minWidth: '96px', maxWidth: '96px', whiteSpace: 'nowrap' }}>11/Set</th>
                    <th style={{ padding: '12px 4px', textAlign: 'center', width: '96px', minWidth: '96px', maxWidth: '96px', whiteSpace: 'nowrap' }}>12/Set</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '145px', minWidth: '145px' }}>Emissões &amp; Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritos.map((inscrito) => (
                    <InscritoRow
                      key={inscrito.id}
                      inscrito={inscrito}
                      isCredenciador={isCredenciador}
                      isSuporte={isSuporte}
                      podeConfirmarPresenca={podeConfirmarPresenca}
                      updatingDia11={updatingAction === `${inscrito.id}-11`}
                      updatingDia12={updatingAction === `${inscrito.id}-12`}
                      baixandoCracha={baixandoCrachaId === inscrito.id}
                      enviandoCert={enviandoCertId === inscrito.id}
                      baixandoCert={baixandoCertId === inscrito.id}
                      deletando={deletandoId === inscrito.id}
                      onOpenOficinas={setSelectedInscritoOficinas}
                      onTogglePresenca={handleTogglePresenca}
                      onBaixarCracha={handleBaixarCracha}
                      onEnviarCertificado={handleEnviarCertificado}
                      onBaixarCertificado={handleBaixarCertificado}
                      onSolicitarExclusao={setInscritoParaExcluir}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Elemento Sentinel para Infinite Scroll automático */}
            <div ref={sentinelRef} style={{ height: '10px' }} />

            {/* Indicador de Carregamento Progressivo (100 por vez) */}
            {loadingMore ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  color: '#4b5563',
                  fontSize: '0.84rem',
                  fontWeight: '600',
                }}
              >
                <div
                  className="checkin-square-btn__spinner"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderWidth: '2.5px',
                    borderColor: '#2563EB',
                    borderTopColor: 'transparent',
                  }}
                />
                <span>Buscando mais 100 participantes...</span>
              </div>
            ) : temMais ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px',
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={carregarMais}
                  className="btn btn--outline"
                  style={{
                    fontSize: '0.82rem',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Carregar mais 100 participantes (exibindo {inscritos.length} de {totalRegistros})</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.80rem',
                  fontWeight: '600',
                }}
              >
                Exibindo todos os {inscritos.length} participantes encontrados.
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Definição de Oficinas */}
      {selectedInscritoOficinas && (
        <OficinasModal
          inscrito={selectedInscritoOficinas}
          inscritos={inscritos}
          isSuporte={isSuporte}
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
                  {metricasCard.presentesAmbosDias} {metricasCard.presentesAmbosDias === 1 ? 'participante' : 'participantes'}
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
