'use client';

export default function DenunciaCard({ denuncia, status, onVerDetalhes }) {
  const hash = denuncia.protocolo
    ? denuncia.protocolo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  const animationDelay = `${(hash % 5) * 0.05}s`;

  return (
    <div className="denuncia-card" style={{ animationDelay }}>
      <div className="denuncia-card__info">
        <span className="denuncia-card__field">
          <strong>Unidade:</strong> {denuncia.unidade}
        </span>
        <span className="denuncia-card__field">
          <strong>Tipo de denuncia:</strong> Denúncia {denuncia.tipo}
        </span>
        <span className="denuncia-card__field">
          <strong>Data de envio:</strong> {denuncia.dataEnvio}
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

        {(status === 'em_andamento') && (
          <div className="denuncia-card__dates">
            <span className="denuncia-card__date">Data de abertura: {denuncia.dataAbertura}</span>
            <span className="denuncia-card__date">Ultima alteração: {denuncia.ultimaAlteracao}</span>
          </div>
        )}

        {status === 'fechada' && (
          <div className="denuncia-card__dates">
            <span className="denuncia-card__date">Data de abertura: {denuncia.dataAbertura}</span>
            <span className="denuncia-card__date">Ultima alteração: {denuncia.ultimaAlteracao}</span>
            <span className="denuncia-card__date">Data de fechamento: {denuncia.dataFechamento}</span>
          </div>
        )}

        {status === 'arquivada' && (
          <div className="denuncia-card__dates">
            <span className="denuncia-card__date">Data de abertura: {denuncia.dataAbertura}</span>
            <span className="denuncia-card__date">Ultima alteração: {denuncia.ultimaAlteracao}</span>
            <span className="denuncia-card__date">Data de arquivamento: {denuncia.dataArquivamento}</span>
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
