'use client';

import { useState } from 'react';
import { useDenuncias, useAtualizarDenuncia } from '@/hooks/useDenuncias';
import FilterBar from '@/components/admin/FilterBar';
import DenunciaCard from '@/components/admin/DenunciaCard';
import DenunciaDetailModal from '@/components/admin/DenunciaDetailModal';

export default function FechadasPage() {
  const [filtros, setFiltros] = useState({ tipo: '', unidade: '', ordem: 'antigos' });
  const [filtrosAtivos, setFiltrosAtivos] = useState({ tipo: '', unidade: '', ordem: 'antigos' });
  const [selectedDenuncia, setSelectedDenuncia] = useState(null);

  const { data: denuncias = [], isLoading, refetch } = useDenuncias('fechada', filtrosAtivos);
  const atualizarMutation = useAtualizarDenuncia();

  function handleAplicar() {
    setFiltrosAtivos({ ...filtros });
  }

  function handleLimpar() {
    const limpo = { tipo: '', unidade: '', ordem: 'antigos' };
    setFiltros(limpo);
    setFiltrosAtivos(limpo);
  }

  function handleAction(action, payload) {
    atualizarMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedDenuncia(null);
        refetch();
      },
    });
  }

  return (
    <div>
      <h1 className="admin-page__title">Denuncia fechadas</h1>

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
          Nenhuma denúncia fechada.
        </p>
      ) : (
        <div className="denuncia-cards">
          {denuncias.map((d) => (
            <DenunciaCard
              key={d.id}
              denuncia={d}
              status="fechada"
              onVerDetalhes={setSelectedDenuncia}
            />
          ))}
        </div>
      )}

      {selectedDenuncia && (
        <DenunciaDetailModal
          denuncia={selectedDenuncia}
          status="fechada"
          onClose={() => setSelectedDenuncia(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
