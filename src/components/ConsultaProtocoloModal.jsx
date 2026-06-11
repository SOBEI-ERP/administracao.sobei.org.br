'use client';

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

export default function ConsultaProtocoloModal({ resultado, onClose }) {
  if (!resultado) return null;

  return (
    <div className="consulta-modal-overlay" onClick={onClose}>
      <div className="consulta-modal" onClick={(e) => e.stopPropagation()}>
        <button className="consulta-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        {/* ---- Título: Protocolo ---- */}
        <h2 className="consulta-modal__title">{resultado.protocolo}</h2>
        <p className="consulta-modal__status-badge" data-status={resultado.status}>
          {resultado.status === 'na_fila' && 'Aguardando análise'}
          {resultado.status === 'em_andamento' && 'Em andamento'}
          {resultado.status === 'fechada' && 'Protocolo fechado'}
          {resultado.status === 'arquivada' && 'Arquivada'}
        </p>

        {/* ---- Timeline ---- */}
        <div className="consulta-modal__timeline">
          {resultado.timeline.map((item, i) => (
            <div className="consulta-modal__timeline-item" key={i}>
              <div
                className={`consulta-modal__timeline-dot ${
                  item.active
                    ? 'consulta-modal__timeline-dot--active'
                    : 'consulta-modal__timeline-dot--pending'
                }`}
              />
              <span className="consulta-modal__timeline-text">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="consulta-modal__divider" />

        {/* ---- Informações registradas pelo denunciante ---- */}
        <h3 className="consulta-modal__section-title">Informações registradas</h3>

        <div className="consulta-modal__field">
          <span className="consulta-modal__field-label">Unidade</span>
          <span className="consulta-modal__field-value">{resultado.unidade}</span>
        </div>

        <div className="consulta-modal__field">
          <span className="consulta-modal__field-label">Tipo de denúncia</span>
          <span className="consulta-modal__field-value">
            Denúncia {resultado.tipo}
          </span>
        </div>

        <div className="consulta-modal__field">
          <span className="consulta-modal__field-label">Data de envio</span>
          <span className="consulta-modal__field-value">{formatarData(resultado.dataEnvio)}</span>
        </div>

        <div className="consulta-modal__section">
          <span className="consulta-modal__field-label">Descrição</span>
          <div className="consulta-modal__blockquote">
            <p style={{ whiteSpace: 'pre-wrap' }}>{resultado.descricao}</p>
          </div>
        </div>

        <div className="consulta-modal__section">
          <span className="consulta-modal__field-label">Envolvidos</span>
          <div className="consulta-modal__blockquote">
            {resultado.envolvidos ? (
              resultado.envolvidos.split('\n').map((e, i) => <p key={i}>{e}</p>)
            ) : (
              <p>Não informado</p>
            )}
          </div>
        </div>

        <div className="consulta-modal__section">
          <span className="consulta-modal__field-label">Testemunhas</span>
          <div className="consulta-modal__blockquote">
            <p>{resultado.testemunhas || 'Não informado'}</p>
          </div>
        </div>

        {/* ---- Esclarecimento do Admin ---- */}
        <div className="consulta-modal__divider" />
        <h3 className="consulta-modal__section-title">
          Esclarecimento da equipe de apuração
        </h3>

        {resultado.medidasAdotadas ? (
          <div className="consulta-modal__esclarecimento">
            <p style={{ whiteSpace: 'pre-wrap' }}>{resultado.medidasAdotadas}</p>
          </div>
        ) : (
          <div className="consulta-modal__esclarecimento consulta-modal__esclarecimento--empty">
            <p>Nenhum esclarecimento registrado até o momento. A equipe de apuração atualizará este campo conforme o andamento da investigação.</p>
          </div>
        )}

        {/* ---- Relatório de Conclusão ---- */}
        {resultado.relatorioConclusao && (
          <>
            <div className="consulta-modal__divider" />
            <h3 className="consulta-modal__section-title">
              Relatório de Conclusão / Desfecho
            </h3>
            <div className="consulta-modal__esclarecimento" style={{ borderColor: 'var(--color-success, #22c55e)' }}>
              <p style={{ whiteSpace: 'pre-wrap', fontWeight: '500', marginBottom: '8px' }}>
                <strong>Tipo de encerramento:</strong> {resultado.tipoConclusao === 'FINAL' ? 'Conclusão Definitiva' : 'Arquivamento'}
              </p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{resultado.relatorioConclusao}</p>
            </div>
          </>
        )}

        {/* ---- Botão Fechar ---- */}
        <div className="consulta-modal__actions">
          <button className="btn btn--outline-white consulta-modal__btn-close" onClick={onClose} type="button">
            <strong>Fechar</strong>
          </button>
        </div>
      </div>
    </div>
  );
}
