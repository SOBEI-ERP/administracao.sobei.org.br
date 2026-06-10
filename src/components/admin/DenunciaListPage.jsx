'use client';

// ============================================
// SOBEI Portal — Página de Listagem de Denúncias (Reutilizável)
// ============================================
// Componente unificado que substitui as 4 páginas duplicadas
// (fila, andamento, fechadas, arquivadas).
// Basta passar o `status` como prop e toda a lógica é compartilhada.

import { useState } from 'react';
import { useDenuncias, useAtualizarDenuncia } from '@/hooks/useDenuncias';
import { STATUS_CONFIG, FILTROS_INICIAIS } from '@/lib/navigation';
import FilterBar from '@/components/admin/FilterBar';
import DenunciaCard from '@/components/admin/DenunciaCard';
import DenunciaDetailModal from '@/components/admin/DenunciaDetailModal';

export default function DenunciaListPage({ status }) {
  const config = STATUS_CONFIG[status];
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIAIS });
  const [filtrosAtivos, setFiltrosAtivos] = useState({ ...FILTROS_INICIAIS });
  const [selectedDenuncia, setSelectedDenuncia] = useState(null);

  const { data: denuncias = [], isLoading, refetch } = useDenuncias(status, filtrosAtivos);
  const atualizarMutation = useAtualizarDenuncia();

  function handleAplicar() {
    setFiltrosAtivos({ ...filtros });
  }

  function handleLimpar() {
    setFiltros({ ...FILTROS_INICIAIS });
    setFiltrosAtivos({ ...FILTROS_INICIAIS });
  }

  function handleAction(action, payload) {
    atualizarMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedDenuncia(null);
        refetch();
      },
      onError: (err) => {
        alert(err.message || 'Erro ao processar a ação. Tente novamente.');
      },
    });
  }

  return (
    <div>
      <h1 className="admin-page__title">{config.titulo}</h1>

      <FilterBar
        filtros={filtros}
        setFiltros={setFiltros}
        onAplicar={handleAplicar}
        onLimpar={handleLimpar}
      />

      {isLoading ? (
        <p style={{ color: 'var(--color-gray-500)', padding: '24px 0' }}>Carregando...</p>
      ) : denuncias.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500)', padding: '24px 0' }}>
          {config.mensagemVazia}
        </p>
      ) : (
        <div className="denuncia-cards">
          {denuncias.map((d) => (
            <DenunciaCard
              key={d.id}
              denuncia={d}
              status={status}
              onVerDetalhes={setSelectedDenuncia}
            />
          ))}
        </div>
      )}

      {selectedDenuncia && (
        <DenunciaDetailModal
          denuncia={selectedDenuncia}
          status={status}
          onClose={() => setSelectedDenuncia(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
