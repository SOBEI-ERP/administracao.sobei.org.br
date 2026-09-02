'use client';

import { useState } from 'react';
import { IconClose, IconCheck, IconSearch, IconWarning } from '@/components/Icons';
import { OFICINAS_CONGRESSO, calcularOcupacaoUnidade, normalizarNomeUnidade, UNIDADES_COM_COTA } from '@/lib/congressoOficinas';

export default function OficinasModal({ inscrito, inscritos = [], onClose, onSave }) {
  const [oficina, setOficina] = useState(
    inscrito?.oficina || inscrito?.oficinaManha || inscrito?.oficinaTarde || ''
  );
  const [busca, setBusca] = useState('');
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState('todas'); // 'todas' | 'disponiveis'
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!inscrito) return null;

  const isSobei = inscrito.tipoOsc?.toUpperCase() === 'SOBEI';
  const unidadeNorm = normalizarNomeUnidade(inscrito.unidade);
  const temCotaUnidade = isSobei && UNIDADES_COM_COTA.includes(unidadeNorm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    // Validação de cota no frontend
    if (isSobei && oficina) {
      const { esgotada, limite, ocupadas } = calcularOcupacaoUnidade(
        oficina,
        inscrito.unidade,
        inscritos,
        inscrito.id
      );

      const oficinaAnterior = (inscrito.oficina || inscrito.oficinaManha || inscrito.oficinaTarde || '').trim().toLowerCase();
      if (esgotada && oficinaAnterior !== oficina.trim().toLowerCase()) {
        setErro(`A cota desta oficina para o CEI ${unidadeNorm} já foi preenchida (${ocupadas}/${limite} vagas). Escolha outra oficina.`);
        setSalvando(false);
        return;
      }
    }

    try {
      await onSave(inscrito.id, {
        oficina: oficina.trim(),
        oficinaManha: oficina.trim(),
        oficinaTarde: oficina.trim(),
      });
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar oficina do participante.');
    } finally {
      setSalvando(false);
    }
  };

  const unidadeTexto = isSobei
    ? (inscrito.unidade?.toUpperCase().startsWith('CEI ') ||
       inscrito.unidade?.toUpperCase().startsWith('CEDESP') ||
       inscrito.unidade?.toUpperCase().startsWith('CCINTER') ||
       inscrito.unidade?.toUpperCase().startsWith('NCI')
        ? inscrito.unidade.toUpperCase()
        : `CEI ${inscrito.unidade?.toUpperCase() || ''}`)
    : (inscrito.outraOsc ? inscrito.outraOsc.toUpperCase() : 'OSC / UNIDADE');

  const oficinaSelecionadaObj = OFICINAS_CONGRESSO.find((item) => item.tema === oficina);
  const statusOcupacaoAtual = (isSobei && oficina)
    ? calcularOcupacaoUnidade(oficina, inscrito.unidade, inscritos, inscrito.id)
    : null;

  // Filtragem das oficinas na coluna da esquerda
  const oficinasFiltradas = OFICINAS_CONGRESSO.filter((item) => {
    const termo = busca.trim().toLowerCase();
    const matchTexto = !termo ||
      item.ministrante.toLowerCase().includes(termo) ||
      item.tema.toLowerCase().includes(termo) ||
      item.categoria.toLowerCase().includes(termo);

    if (!matchTexto) return false;

    if (filtroDisponibilidade === 'disponiveis' && isSobei && unidadeNorm) {
      const ocup = calcularOcupacaoUnidade(item.tema, inscrito.unidade, inscritos, inscrito.id);
      if (ocup.esgotada && oficina !== item.tema) return false;
    }

    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1020px',
          width: '95vw',
          padding: 0,
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#0c1b33',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
              Definir Oficina do Participante
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: 'rgba(255,255,255,0.8)' }}>
              Participante: <strong>{inscrito.nomeCompleto}</strong> — Unidade: <strong style={{ color: '#93C5FD' }}>{unidadeTexto}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="modal__close"
            style={{
              position: 'static',
              color: '#ffffff',
              background: 'rgba(255,255,255,0.1)',
              padding: '6px',
              borderRadius: '8px',
            }}
            aria-label="Fechar modal"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Formulário com Grid em 2 Colunas */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {erro && (
            <div
              style={{
                margin: '14px 24px 0',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IconWarning size={16} />
              <span>{erro}</span>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(360px, 1.25fr)',
              gap: '20px',
              padding: '20px 24px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {/* ---- COLUNA ESQUERDA: LISTA DE OFICINEIROS & OFICINAS ---- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Barra de Busca e Filtros */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar oficineiro ou tema..."
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                    <IconSearch size={16} />
                  </div>
                  {busca && (
                    <button
                      type="button"
                      onClick={() => setBusca('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>

                {/* Filtro Rápido e Botão Limpar Seleção */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFiltroDisponibilidade('todas')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: filtroDisponibilidade === 'todas' ? '#1E293B' : '#F1F5F9',
                        color: filtroDisponibilidade === 'todas' ? '#FFFFFF' : '#475569',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Todas ({OFICINAS_CONGRESSO.length})
                    </button>
                    {temCotaUnidade && (
                      <button
                        type="button"
                        onClick={() => setFiltroDisponibilidade('disponiveis')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: filtroDisponibilidade === 'disponiveis' ? '#059669' : '#F1F5F9',
                          color: filtroDisponibilidade === 'disponiveis' ? '#FFFFFF' : '#475569',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        Com Vagas no CEI {unidadeNorm}
                      </button>
                    )}
                  </div>

                  {oficina && (
                    <button
                      type="button"
                      onClick={() => { setOficina(''); setErro(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Limpar Seleção
                    </button>
                  )}
                </div>
              </div>

              {/* Lista Scrollável de Oficineiros/Oficinas */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {oficinasFiltradas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontSize: '0.86rem' }}>
                    Nenhuma oficina encontrada com os critérios informados.
                  </div>
                ) : (
                  oficinasFiltradas.map((item) => {
                    const isSelected = oficina === item.tema;
                    let isEsgotada = false;
                    let ocupStatus = null;

                    if (isSobei && unidadeNorm) {
                      ocupStatus = calcularOcupacaoUnidade(item.tema, inscrito.unidade, inscritos, inscrito.id);
                      isEsgotada = ocupStatus.esgotada && !isSelected;
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isEsgotada || isSelected) {
                            setOficina(item.tema);
                            setErro('');
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          backgroundColor: isSelected
                            ? '#EFF6FF'
                            : isEsgotada
                            ? '#F8FAFC'
                            : '#FFFFFF',
                          cursor: isEsgotada ? 'not-allowed' : 'pointer',
                          opacity: isEsgotada ? 0.6 : 1,
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {/* Linha 1: Nome do Oficineiro & Status de Vagas */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.90rem', color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                            {item.ministrante}
                          </span>

                          {ocupStatus?.temCota ? (
                            <span
                              style={{
                                fontSize: '0.70rem',
                                fontWeight: '800',
                                padding: '2px 7px',
                                borderRadius: '10px',
                                backgroundColor: ocupStatus.esgotada
                                  ? (isSelected ? '#1E293B' : '#FEE2E2')
                                  : '#DCFCE7',
                                color: ocupStatus.esgotada
                                  ? (isSelected ? '#FFFFFF' : '#991B1B')
                                  : '#166534',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ocupStatus.esgotada
                                ? `Esgotada (${ocupStatus.ocupadas}/${ocupStatus.limite})`
                                : `${ocupStatus.ocupadas}/${ocupStatus.limite} vagas`}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: '600',
                                color: '#64748B',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.vagasSala || 30} vagas
                            </span>
                          )}
                        </div>

                        {/* Linha 2: Resumo do Tema */}
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#475569',
                            lineHeight: '1.25',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.tema}
                        </div>

                        {/* Linha 3: Categoria / Eixo */}
                        <div style={{ fontSize: '0.70rem', color: '#94A3B8', fontWeight: '600' }}>
                          {item.categoria}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ---- COLUNA DIREITA: DETALHES DA OFICINA & PRÉVIA DO CRACHÁ ---- */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #E2E8F0',
              }}
            >
              {oficinaSelecionadaObj ? (
                <>
                  {/* Bloco de Detalhes da Oficina Selecionada */}
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#2563EB', letterSpacing: '0.04em' }}>
                        Oficina Selecionada
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                        {oficinaSelecionadaObj.categoria}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#0F172A' }}>
                      {oficinaSelecionadaObj.ministrante}
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: '0.86rem', color: '#334155', lineHeight: '1.4', fontWeight: '500' }}>
                      &ldquo;{oficinaSelecionadaObj.tema}&rdquo;
                    </p>

                    {/* Resumo de Vagas da Unidade — Apenas escrita limpa sem fundo colorido */}
                    {statusOcupacaoAtual?.temCota ? (
                      <div style={{ marginTop: '2px', fontSize: '0.82rem', color: statusOcupacaoAtual.esgotada ? '#DC2626' : '#475569' }}>
                        {statusOcupacaoAtual.esgotada ? (
                          <span>
                            <strong>Vagas esgotadas para o CEI {unidadeNorm}:</strong> {statusOcupacaoAtual.ocupadas} de {statusOcupacaoAtual.limite} preenchidas
                          </span>
                        ) : (
                          <span>
                            <strong>Vagas no CEI {unidadeNorm}:</strong> {statusOcupacaoAtual.ocupadas} de {statusOcupacaoAtual.limite} preenchidas ({statusOcupacaoAtual.disponiveis} restante{statusOcupacaoAtual.disponiveis === 1 ? '' : 's'})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: '2px', fontSize: '0.82rem', color: '#64748B' }}>
                        <strong>Capacidade total da sala:</strong> {oficinaSelecionadaObj.vagasSala || 30} vagas
                      </div>
                    )}
                  </div>

                  {/* Prévia do Crachá Oficial Modelo Novo (Tilibra TB182) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        fontWeight: '800',
                        color: '#64748B',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Prévia do Crachá Oficial (Tilibra TB182)
                    </span>

                    {/* Cartão do Crachá */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        maxWidth: '360px',
                        width: '100%',
                        aspectRatio: '288 / 96.1',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 1. Faixa Azul com Badge */}
                      <div
                        style={{
                          backgroundColor: '#2E74B5',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            border: '1px solid #ffffff',
                            height: '15px',
                            width: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#2E74B5',
                              fontWeight: '800',
                              fontSize: '0.62rem',
                              height: '100%',
                              width: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              letterSpacing: '0.04em',
                            }}
                          >
                            XX
                          </div>
                          <div
                            style={{
                              color: '#ffffff',
                              fontWeight: '800',
                              fontSize: '0.60rem',
                              flex: 1,
                              textAlign: 'center',
                              letterSpacing: '0.04em',
                            }}
                          >
                            CONGRESSO
                          </div>
                        </div>
                      </div>

                      {/* 2. Nome do Participante */}
                      <div
                        style={{
                          padding: '2px 8px 0',
                          fontSize: '0.94rem',
                          fontWeight: '800',
                          color: '#000000',
                          lineHeight: '1.2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        {inscrito.nomeCompleto}
                      </div>

                      {/* 3. Linha Azul Divisória Central */}
                      <div
                        style={{
                          width: '55%',
                          height: '1.5px',
                          backgroundColor: '#2E74B5',
                          margin: '0 auto',
                        }}
                      />

                      {/* 4. Unidade / CEI */}
                      <div
                        style={{
                          color: '#2E74B5',
                          fontWeight: '800',
                          fontSize: '0.76rem',
                          letterSpacing: '0.03em',
                          lineHeight: '1.1',
                        }}
                      >
                        {unidadeTexto}
                      </div>

                      {/* 5. Linha de Oficina Única */}
                      <div
                        style={{
                          padding: '0 10px 4px',
                          fontSize: '0.68rem',
                          color: '#000000',
                          lineHeight: '1.15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <strong style={{ fontWeight: '800' }}>OFICINA:</strong>
                        <span
                          style={{
                            color: '#1E293B',
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={oficina}
                        >
                          {oficina}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '260px',
                    textAlign: 'center',
                    color: '#64748B',
                    padding: '20px',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                    }}
                  >
                    <IconSearch size={22} />
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B' }}>
                    Nenhuma oficina selecionada
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', maxWidth: '280px', lineHeight: '1.4' }}>
                    Selecione um oficineiro na lista à esquerda para visualizar os detalhes completos, a cota de vagas e a prévia do crachá.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé e Ações do Modal */}
          <div
            className="modal__actions"
            style={{
              padding: '14px 24px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              {oficina ? (
                <span>
                  Oficina escolhida: <strong style={{ color: '#0F172A' }}>{oficinaSelecionadaObj?.ministrante || 'Selecionada'}</strong>
                </span>
              ) : (
                <span>Nenhuma oficina definida</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={salvando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: '35px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.90rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minHeight: '42px',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '35px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: '#0C1B33',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  minHeight: '42px',
                  boxShadow: '0 2px 8px rgba(12, 27, 51, 0.25)',
                }}
              >
                {salvando ? (
                  <span style={{ color: '#FFFFFF' }}>Salvando...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: '#FFFFFF' }}>Salvar Oficina</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
