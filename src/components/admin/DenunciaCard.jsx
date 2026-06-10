'use client';

// ============================================
// SOBEI Portal — Card de Denúncia
// ============================================
// Configuração data-driven de datas extras por status,
// eliminando blocos condicionais repetitivos.

/**
 * Mapeia cada status às datas extras que devem ser exibidas no card.
 * Cada entrada tem a label de exibição e o campo correspondente na denúncia.
 */
const DATAS_POR_STATUS = {
  na_fila: [],
  em_andamento: [
    { label: 'Data de abertura', campo: 'dataAbertura' },
    { label: 'Última alteração', campo: 'ultimaAlteracao' },
  ],
  fechada: [
    { label: 'Data de abertura', campo: 'dataAbertura' },
    { label: 'Última alteração', campo: 'ultimaAlteracao' },
    { label: 'Data de fechamento', campo: 'dataFechamento' },
  ],
  arquivada: [
    { label: 'Data de abertura', campo: 'dataAbertura' },
    { label: 'Última alteração', campo: 'ultimaAlteracao' },
    { label: 'Data de arquivamento', campo: 'dataArquivamento' },
  ],
};

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

export default function DenunciaCard({ denuncia, status, onVerDetalhes }) {
  const hash = denuncia.protocolo
    ? denuncia.protocolo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  const animationDelay = `${(hash % 5) * 0.05}s`;

  const datasExtras = DATAS_POR_STATUS[status] || [];

  return (
    <div className="denuncia-card" style={{ animationDelay }}>
      <div className="denuncia-card__info">
        <span className="denuncia-card__field">
          <strong>Unidade:</strong> {denuncia.unidade}
        </span>
        <span className="denuncia-card__field">
          <strong>Tipo de denuncia:</strong> Denúncia {denuncia.tipo && denuncia.tipo.toLowerCase() === 'anonima' ? 'anônima' : 'identificada'}
        </span>
        <span className="denuncia-card__field">
          <strong>Data de envio:</strong> {formatarData(denuncia.dataEnvio)}
        </span>
        {status !== 'na_fila' && denuncia.protocolo && (
          <span className="denuncia-card__field">
            <strong>Protocolo:</strong> {denuncia.protocolo}
          </span>
        )}
      </div>

      <div className="denuncia-card__right">
        {status === 'na_fila' && (
          <span className="denuncia-card__protocol">
            Protocolo: {denuncia.protocolo}
          </span>
        )}

        {datasExtras.length > 0 && (
          <div className="denuncia-card__dates">
            {datasExtras.map(({ label, campo }) => (
              <span key={campo} className="denuncia-card__date">
                {label}: {formatarData(denuncia[campo])}
              </span>
            ))}
          </div>
        )}

        <button
          className="btn btn--purple btn--sm"
          onClick={() => onVerDetalhes(denuncia)}
          type="button"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}
