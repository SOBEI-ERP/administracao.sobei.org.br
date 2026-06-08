'use client';

import { useState } from 'react';

export default function DenunciaDetailModal({ denuncia, status, onClose, onAction }) {
  const [medidas, setMedidas] = useState(denuncia?.medidasAdotadas || '');
  const [relatorioFinal, setRelatorioFinal] = useState(denuncia?.relatorioFinal || '');

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

  function handleFechar() {
    onAction?.('fechar', {
      id: denuncia.id,
      data: {
        status: 'fechada',
        dataFechamento: new Date().toLocaleDateString('pt-BR'),
        ultimaAlteracao: new Date().toLocaleDateString('pt-BR'),
        medidasAdotadas: medidas,
        relatorioFinal: relatorioFinal || medidas,
      },
    });
  }

  function handleSalvar() {
    onAction?.('salvar', {
      id: denuncia.id,
      data: {
        medidasAdotadas: medidas,
        ultimaAlteracao: new Date().toLocaleDateString('pt-BR'),
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2 className="modal__title">Detalhes da denúncia</h2>

        {/* Informações da denúncia */}
        <div className="modal__section">
          <h3 className="modal__section-title">Informações da denuncia</h3>
          <div className="modal__blockquote">
            <p>Protocolo: {denuncia.protocolo}</p>
            <p>Unidade: {denuncia.unidade}</p>
            <p>Tipo de denuncia: Denúncia {denuncia.tipo}</p>
            <p>Data de envio: {denuncia.dataEnvio}</p>
            {denuncia.dataFechamento && <p>Data de fechamento: {denuncia.dataFechamento}</p>}
            {denuncia.dataArquivamento && <p>Data de arquivamento: {denuncia.dataArquivamento}</p>}
          </div>
        </div>

        {/* Descrição */}
        <div className="modal__section">
          <h3 className="modal__section-title">Descrição da denúncia</h3>
          <div className="modal__blockquote">
            <p style={{ whiteSpace: 'pre-wrap' }}>{denuncia.descricao}</p>
          </div>
        </div>

        {/* Envolvidos */}
        <div className="modal__section">
          <h3 className="modal__section-title">Quem estava envolvido:</h3>
          <div className="modal__blockquote">
            {denuncia.envolvidos?.split('\n').map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        </div>

        {/* Testemunhas */}
        <div className="modal__section">
          <h3 className="modal__section-title">Quem testemunhou os fatos?</h3>
          <div className="modal__blockquote">
            <p>{denuncia.testemunhas || 'Não informado'}</p>
          </div>
        </div>

        {/* ---- Status-specific sections ---- */}

        {/* Em andamento: campo de medidas editável */}
        {status === 'em_andamento' && (
          <>
            <div className="modal__divider" />
            <div className="modal__section">
              <h3 className="modal__section-subtitle">Medidas adotadas até o momento</h3>
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
              <h3 className="modal__section-subtitle">Medidas adotadas até o momento</h3>
              <div className="modal__blockquote">
                <p>{denuncia.medidasAdotadas || 'Nenhuma medida registrada.'}</p>
              </div>
            </div>
            <div className="modal__section">
              <h3 className="modal__section-subtitle">Relatório final da denúncia</h3>
              <div className="modal__blockquote">
                <p>{denuncia.relatorioFinal || 'Nenhum relatório registrado.'}</p>
              </div>
            </div>
          </>
        )}

        {/* Arquivadas: medidas + relatório de arquivamento (somente leitura) */}
        {status === 'arquivada' && (
          <>
            <div className="modal__divider" />
            <div className="modal__section">
              <h3 className="modal__section-subtitle">Medidas adotadas até o momento</h3>
              <div className="modal__blockquote">
                <p>{denuncia.medidasAdotadas || 'Nenhuma medida registrada.'}</p>
              </div>
            </div>
            <div className="modal__section">
              <h3 className="modal__section-subtitle">Relatório de arquivamento da denúncia</h3>
              <div className="modal__blockquote">
                <p>{denuncia.relatorioArquivamento || 'Nenhum relatório registrado.'}</p>
              </div>
            </div>
          </>
        )}

        {/* ---- Action Buttons ---- */}
        <div className="modal__actions">
          {status === 'na_fila' && (
            <>
              <button className="btn btn--danger" onClick={handleFechar} type="button">
                Fechar denúncia
              </button>
              <button className="btn btn--success" onClick={handleApurar} type="button">
                Apurar denúncia
              </button>
            </>
          )}

          {status === 'em_andamento' && (
            <>
              <button className="btn btn--danger" onClick={handleFechar} type="button">
                Fechar denúncia
              </button>
              <button className="btn btn--success" onClick={handleSalvar} type="button">
                Salvar alterações
              </button>
            </>
          )}

          {(status === 'fechada' || status === 'arquivada') && (
            <button className="btn btn--purple" onClick={handleReabrir} type="button">
              Reabrir denúncia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
