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

export default function DenunciaDetailModal({ denuncia, status, onClose, onAction }) {
  const { data: detalhes, isLoading } = useDenunciaDetalhes(denuncia?.id);
  const [medidas, setMedidas] = useState('');
  const [relatorioFinal, setRelatorioFinal] = useState('');
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [tipoConclusaoLocal, setTipoConclusaoLocal] = useState('FINAL'); // 'FINAL' or 'ARQUIVAMENTO'

  useEffect(() => {
    if (detalhes) {
      setTimeout(() => {
        setMedidas(detalhes.medidasAdotadas ? detalhes.medidasAdotadas.join('\n') : '');
        setRelatorioFinal(detalhes.relatorioConclusao || '');
      }, 0);
    }
  }, [detalhes]);

  if (!denuncia) return null;

  // Actions based on status
  function handleApurar() {
    onAction?.('apurar', {
      id: denuncia.id,
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
    const targetStatus = tipoConclusaoLocal === 'FINAL' ? 'fechada' : 'arquivada';
    onAction?.(tipoConclusaoLocal === 'FINAL' ? 'fechar' : 'arquivar', {
      id: denuncia.id,
      data: {
        status: targetStatus,
        descricaoAcao: medidas,
        relatorio: relatorioFinal,
        tipoConclusao: tipoConclusaoLocal
      },
    });
  }

  function handleSalvar() {
    onAction?.('salvar', {
      id: denuncia.id,
      data: {
        status: 'em_andamento',
        descricaoAcao: medidas
      },
    });
  }

  function handleReabrir() {
    onAction?.('reabrir', {
      id: denuncia.id,
      data: {
        status: 'em_andamento',
        ultimaAlteracao: new Date().toLocaleDateString('pt-BR'),
      },
    });
  }

  const displayDenuncia = detalhes || denuncia;

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
              </div>
            </div>

            {/* Descrição */}
            <div className="modal__section">
              <h3 className="modal__section-title">Descrição da denúncia</h3>
              <div className="modal__blockquote">
                <p style={{ whiteSpace: 'pre-wrap' }}>"{displayDenuncia.descricao}"</p>
              </div>
            </div>

            {/* Envolvidos */}
            <div className="modal__section">
              <h3 className="modal__section-title">Quem estava envolvido:</h3>
              <div className="modal__blockquote">
                {displayDenuncia.envolvidos?.split('\n').map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
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
                  <textarea
                    className="modal__textarea"
                    placeholder="Escreva sobre as ações tomadas até o momento"
                    value={medidas}
                    onChange={(e) => setMedidas(e.target.value)}
                  />
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
                    <p style={{ whiteSpace: 'pre-wrap' }}>{displayDenuncia.medidasAdotadas && displayDenuncia.medidasAdotadas.length > 0 ? displayDenuncia.medidasAdotadas.join('\n') : 'Nenhuma medida registrada.'}</p>
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
                    <p style={{ whiteSpace: 'pre-wrap' }}>{displayDenuncia.medidasAdotadas && displayDenuncia.medidasAdotadas.length > 0 ? displayDenuncia.medidasAdotadas.join('\n') : 'Nenhuma medida registrada.'}</p>
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
