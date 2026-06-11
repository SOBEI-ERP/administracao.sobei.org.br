'use client';

import { useState, useEffect } from 'react';
import { useDenunciaDetalhes } from '@/hooks/useDenuncias';

function formatarData(dataStr) {
  if (!dataStr) return '';
  if (dataStr.includes('-') || dataStr.includes('T')) {
    try {
      const date = new Date(dataStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return dataStr;
    }
  }
  return dataStr;
}

function normalizeMedidasList(value) {
  if (!value) return [];

  const medidas = Array.isArray(value) ? value : [value];

  return medidas
    .map((medida, index) => {
      if (typeof medida === 'string') {
        return { id: `medida-${index}`, descricao: medida };
      }

      if (!medida || typeof medida !== 'object') {
        return null;
      }

      return {
        ...medida,
        id: medida.id ?? medida.medidaId ?? `medida-${index}`,
        descricao:
          medida.descricao ??
          medida.descricaoAcao ??
          medida.medida ??
          medida.texto ??
          '',
      };
    })
    .filter(Boolean);
}

function hasDisplayValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function mergeDenunciaData(base, detalhes) {
  const merged = { ...(base || {}) };
  const source = detalhes || {};

  Object.entries(source).forEach(([key, value]) => {
    if (hasDisplayValue(value)) {
      merged[key] = value;
    }
  });

  const denunciante = source.denunciante || source.denuncianteIdentificado || source.denunciante_identificado || {};
  merged.status = source.status ?? source.estado ?? merged.status;
  merged.tipo = source.tipo ?? source.tipoDenuncia ?? source.tipo_denuncia ?? merged.tipo;
  merged.unidade = source.unidade ?? source.unidadeOcorrencia ?? source.unidade_ocorrencia ?? merged.unidade;
  merged.dataEnvio = source.dataEnvio ?? source.data_envio ?? source.dataCriacao ?? source.data_criacao ?? source.criadoEm ?? source.criado_em ?? merged.dataEnvio;
  merged.descricao = source.descricao ?? source.descricaoDenuncia ?? source.descricao_denuncia ?? source.relato ?? source.detalhes ?? merged.descricao;
  merged.envolvidos = source.envolvidos ?? source.pessoasEnvolvidas ?? source.pessoas_envolvidas ?? source.quemEstavaEnvolvido ?? source.quem_estava_envolvido ?? merged.envolvidos;
  merged.testemunhas = source.testemunhas ?? source.quemTestemunhou ?? source.quem_testemunhou ?? source.testemunhasFatos ?? source.testemunhas_fatos ?? merged.testemunhas;
  merged.nomeDenunciante =
    source.nomeDenunciante ??
    source.nome_denunciante ??
    source.nomeCompleto ??
    source.nome_completo ??
    source.nome ??
    denunciante.nomeCompleto ??
    denunciante.nome_completo ??
    denunciante.nome ??
    merged.nomeDenunciante;
  merged.emailDenunciante = source.emailDenunciante ?? source.email_denunciante ?? source.email ?? denunciante.email ?? merged.emailDenunciante;
  merged.telefoneDenunciante = source.telefoneDenunciante ?? source.telefone_denunciante ?? source.telefone ?? denunciante.telefone ?? merged.telefoneDenunciante;
  merged.medidasAdotadas = normalizeMedidasList(source.medidasAdotadas ?? source.medidas_adotadas ?? source.medidas ?? source.historicoMedidas ?? source.historico_medidas ?? merged.medidasAdotadas);
  merged.relatorioConclusao =
    source.relatorioConclusao ??
    source.relatorio_conclusao ??
    source.relatorioFinal ??
    source.relatorio_final ??
    source.relatorioArquivamento ??
    source.relatorio_arquivamento ??
    source.conclusao?.relatorio ??
    merged.relatorioConclusao;
  merged.tipoConclusao = source.tipoConclusao ?? source.tipo_conclusao ?? source.conclusao?.tipoConclusao ?? source.conclusao?.tipo_conclusao ?? merged.tipoConclusao;

  return merged;
}

export default function DenunciaDetailModal({ denuncia, status, onClose, onAction }) {
  const { data: detalhes, isLoading } = useDenunciaDetalhes(denuncia?.protocolo);
  const [medidasList, setMedidasList] = useState([]);
  const [novaMedida, setNovaMedida] = useState('');
  const [editingMeasureId, setEditingMeasureId] = useState(null);
  const [editingMeasureText, setEditingMeasureText] = useState('');
  const [relatorioFinal, setRelatorioFinal] = useState('');
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [tipoConclusaoLocal, setTipoConclusaoLocal] = useState('FINAL'); // 'FINAL' or 'ARQUIVAMENTO'

  useEffect(() => {
    const display = mergeDenunciaData(denuncia, detalhes);
    setTimeout(() => {
      setMedidasList(normalizeMedidasList(display.medidasAdotadas));
      setRelatorioFinal(display.relatorioConclusao || '');
    }, 0);
  }, [denuncia, detalhes]);

  if (!denuncia) return null;

  // Actions based on status
  function handleApurar() {
    onAction?.('apurar', {
      protocolo: denuncia.protocolo,
      data: {
        status: 'em_andamento',
        dataAbertura: new Date().toLocaleDateString('pt-BR'),
        ultimaAlteracao: new Date().toLocaleDateString('pt-BR'),
      },
    });
  }

  function handleConfirmarEncerramento() {
    if (!relatorioFinal.trim()) {
      alert('Por favor, insira o relatório de encerramento.');
      return;
    }
    const finalMedidas = [...medidasList];
    if (novaMedida.trim()) {
      finalMedidas.push({ id: null, descricao: novaMedida.trim() });
    }
    const targetStatus = tipoConclusaoLocal === 'FINAL' ? 'fechada' : 'arquivada';
    onAction?.(tipoConclusaoLocal === 'FINAL' ? 'fechar' : 'arquivar', {
      protocolo: denuncia.protocolo,
      data: {
        status: targetStatus,
        medidas: finalMedidas,
        relatorio: relatorioFinal,
        tipoConclusao: tipoConclusaoLocal
      },
    });
    setNovaMedida('');
  }

  function handleSalvar() {
    const finalMedidas = [...medidasList];
    if (novaMedida.trim()) {
      finalMedidas.push({ id: null, descricao: novaMedida.trim() });
    }
    onAction?.('salvar', {
      protocolo: denuncia.protocolo,
      data: {
        status: 'em_andamento',
        medidas: finalMedidas
      },
    });
    setNovaMedida('');
  }

  function handleReabrir() {
    onAction?.('reabrir', {
      protocolo: denuncia.protocolo,
      data: {
        status: 'em_andamento',
        ultimaAlteracao: new Date().toLocaleDateString('pt-BR'),
      },
    });
  }

  const displayDenuncia = mergeDenunciaData(denuncia, detalhes);

  const tipoDenunciaFormatado = displayDenuncia.tipo && displayDenuncia.tipo.toLowerCase() === 'anonima'
    ? 'anônima'
    : 'identificada';

  if (confirmingClose) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>

          <h2 className="modal__title">Encerramento do protocolo</h2>

          <div className="modal__section">
            <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
              Relatório de encerramento da denúncia
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
              Insira o relatório final de apuração. Este relatório ficará anexado ao protocolo de forma permanente.
            </p>
            <textarea
              className="modal__textarea"
              placeholder="Descreva aqui o relatório final do encerramento ou arquivamento do caso..."
              value={relatorioFinal}
              onChange={(e) => setRelatorioFinal(e.target.value)}
            />
          </div>

          <div className="modal__section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <h4 className="modal__section-title" style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>Selecione o tipo de encerramento:</h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-xs)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>
                <input
                  type="radio"
                  name="tipoConclusao"
                  value="FINAL"
                  checked={tipoConclusaoLocal === 'FINAL'}
                  onChange={() => setTipoConclusaoLocal('FINAL')}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                Conclusão definitiva (Fechada)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>
                <input
                  type="radio"
                  name="tipoConclusao"
                  value="ARQUIVAMENTO"
                  checked={tipoConclusaoLocal === 'ARQUIVAMENTO'}
                  onChange={() => setTipoConclusaoLocal('ARQUIVAMENTO')}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                Arquivar denúncia (Arquivada)
              </label>
            </div>
          </div>

          <div className="modal__actions">
            <button
              className="btn btn--outline"
              onClick={() => setConfirmingClose(false)}
              type="button"
              style={{ border: '1px solid var(--color-gray-300)', backgroundColor: 'transparent', color: 'var(--color-gray-700)', padding: '8px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Voltar
            </button>
            <button
              className="btn btn--danger"
              onClick={handleConfirmarEncerramento}
              type="button"
            >
              Confirmar Encerramento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2 className="modal__title">Detalhes da denúncia</h2>

        {isLoading ? (
          <p style={{ color: 'var(--color-gray-500)', padding: '24px 0', textAlign: 'center' }}>Carregando detalhes...</p>
        ) : (
          <>
            {/* Informações da denúncia */}
            <div className="modal__section">
              <h3 className="modal__section-title">Informações da denúncia</h3>
              <div className="modal__blockquote">
                <p><strong>Protocolo:</strong> {displayDenuncia.protocolo}</p>
                <p><strong>Unidade:</strong> {displayDenuncia.unidade}</p>
                <p><strong>Tipo de denuncia:</strong> Denúncia {tipoDenunciaFormatado}</p>
                <p><strong>Data de envio:</strong> {formatarData(displayDenuncia.dataEnvio)}</p>
                {status === 'fechada' && displayDenuncia.dataFechamento && (
                  <p><strong>Data de fechamento:</strong> {formatarData(displayDenuncia.dataFechamento)}</p>
                )}
                {status === 'arquivada' && displayDenuncia.dataArquivamento && (
                  <p><strong>Data de arquivamento:</strong> {formatarData(displayDenuncia.dataArquivamento)}</p>
                )}
              </div>
            </div>

            {/* Informações do denunciante (se identificada) */}
            {displayDenuncia.tipo && displayDenuncia.tipo.toLowerCase() === 'identificada' && (
              <div className="modal__section">
                <h3 className="modal__section-title">Dados de identificação do denunciante</h3>
                <div className="modal__blockquote">
                  <p><strong>Nome completo:</strong> {displayDenuncia.nomeDenunciante || 'Não informado'}</p>
                  <p><strong>E-mail:</strong> {displayDenuncia.emailDenunciante || 'Não informado'}</p>
                  <p><strong>Telefone:</strong> {displayDenuncia.telefoneDenunciante || 'Não informado'}</p>
                </div>
              </div>
            )}

            {/* Descrição */}
            <div className="modal__section">
              <h3 className="modal__section-title">Descrição da denúncia</h3>
              <div className="modal__blockquote">
                <p style={{ whiteSpace: 'pre-wrap' }}>&ldquo;{displayDenuncia.descricao}&rdquo;</p>
              </div>
            </div>

            {/* Envolvidos */}
            <div className="modal__section">
              <h3 className="modal__section-title">Quem estava envolvido:</h3>
              <div className="modal__blockquote">
                {displayDenuncia.envolvidos ? (
                  displayDenuncia.envolvidos.split('\n').map((e, i) => <p key={i}>{e}</p>)
                ) : (
                  <p>Não informado</p>
                )}
              </div>
            </div>

            {/* Testemunhas */}
            <div className="modal__section">
              <h3 className="modal__section-title">Quem testemunhou os fatos?</h3>
              <div className="modal__blockquote">
                <p>{displayDenuncia.testemunhas || 'Não informado'}</p>
              </div>
            </div>

            {/* ---- Status-specific sections ---- */}

            {/* Em andamento: campo de medidas editável */}
            {status === 'em_andamento' && (
              <>
                <div className="modal__divider" />
                <div className="modal__section">
                  <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    Medidas adotadas até o momento
                  </h3>

                  {/* Lista de Medidas Existentes com opção de edição */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {medidasList.map((medida) => (
                      <div key={medida.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #7C6BC4', paddingLeft: '12px', paddingBottom: '4px' }}>
                        {editingMeasureId === medida.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea
                              className="modal__textarea"
                              style={{ margin: 0, minHeight: '60px' }}
                              value={editingMeasureText}
                              onChange={(e) => setEditingMeasureText(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn--sm btn--success"
                                style={{ padding: '4px 12px', cursor: 'pointer' }}
                                onClick={() => {
                                  if (editingMeasureText.trim()) {
                                    setMedidasList(medidasList.map(m => m.id === medida.id ? { ...m, descricao: editingMeasureText.trim() } : m));
                                    setEditingMeasureId(null);
                                    setEditingMeasureText('');
                                  }
                                }}
                              >
                                Salvar Medida
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--outline"
                                style={{ border: '1px solid var(--color-gray-300)', padding: '4px 12px', background: 'transparent', cursor: 'pointer' }}
                                onClick={() => {
                                  setEditingMeasureId(null);
                                  setEditingMeasureText('');
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--danger"
                                style={{ padding: '4px 12px', cursor: 'pointer' }}
                                onClick={() => {
                                  setMedidasList(medidasList.map(m => m.id === medida.id ? { ...m, descricao: '' } : m));
                                  setEditingMeasureId(null);
                                  setEditingMeasureText('');
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        ) : (
                          medida.descricao && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                              <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--color-gray-800)' }}>
                                {medida.descricao}
                              </p>
                              <button
                                type="button"
                                className="btn btn--outline btn--sm"
                                style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid var(--color-gray-300)', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                                onClick={() => {
                                  setEditingMeasureId(medida.id);
                                  setEditingMeasureText(medida.descricao);
                                }}
                              >
                                Editar
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Campo para Adicionar Nova Medida */}
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-gray-700)' }}>Adicionar nova ação/medida:</h4>
                    <textarea
                      className="modal__textarea"
                      placeholder="Descreva a nova ação tomada..."
                      value={novaMedida}
                      onChange={(e) => setNovaMedida(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Fechadas: medidas + relatório final (somente leitura) */}
            {status === 'fechada' && (
              <>
                <div className="modal__divider" />
                <div className="modal__section">
                  <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    Medidas adotadas até o momento
                  </h3>
                  <div className="modal__blockquote">
                    {medidasList && medidasList.filter(m => m.descricao).length > 0 ? (
                      medidasList.filter(m => m.descricao).map((m, idx) => (
                        <p key={idx} style={{ whiteSpace: 'pre-wrap', borderLeft: '3px solid #7C6BC4', paddingLeft: '8px', marginBottom: '8px' }}>
                          {m.descricao}
                        </p>
                      ))
                    ) : (
                      <p>Nenhuma medida registrada.</p>
                    )}
                  </div>
                </div>
                <div className="modal__section">
                  <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    Relatório final da denúncia
                  </h3>
                  <div className="modal__blockquote">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{displayDenuncia.relatorioConclusao || 'Nenhum relatório registrado.'}</p>
                  </div>
                </div>
              </>
            )}

            {/* Arquivadas: medidas + relatório de arquivamento (somente leitura) */}
            {status === 'arquivada' && (
              <>
                <div className="modal__divider" />
                <div className="modal__section">
                  <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    Medidas adotadas até o momento
                  </h3>
                  <div className="modal__blockquote">
                    {medidasList && medidasList.filter(m => m.descricao).length > 0 ? (
                      medidasList.filter(m => m.descricao).map((m, idx) => (
                        <p key={idx} style={{ whiteSpace: 'pre-wrap', borderLeft: '3px solid #7C6BC4', paddingLeft: '8px', marginBottom: '8px' }}>
                          {m.descricao}
                        </p>
                      ))
                    ) : (
                      <p>Nenhuma medida registrada.</p>
                    )}
                  </div>
                </div>
                <div className="modal__section">
                  <h3 className="modal__section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    Relatório de arquivamento da denúncia
                  </h3>
                  <div className="modal__blockquote">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{displayDenuncia.relatorioConclusao || 'Nenhum relatório registrado.'}</p>
                  </div>
                </div>
              </>
            )}

            {/* ---- Action Buttons ---- */}
            <div className="modal__actions">
              {status === 'na_fila' && (
                <>
                  <button className="btn btn--danger" onClick={() => setConfirmingClose(true)} type="button">
                    Fechar denúncia
                  </button>
                  <button className="btn btn--success" onClick={handleApurar} type="button">
                    Apurar denúncia
                  </button>
                </>
              )}

              {status === 'em_andamento' && (
                <>
                  <button className="btn btn--danger" onClick={() => setConfirmingClose(true)} type="button">
                    Fechar denúncia
                  </button>
                  <button className="btn btn--success" onClick={handleSalvar} type="button">
                    Salvar alterações
                  </button>
                </>
              )}

              {(status === 'fechada' || status === 'arquivada') && (
                <button className="btn btn--success" onClick={handleReabrir} type="button">
                  Reabrir denúncia
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
