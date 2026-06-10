'use client';

// ============================================
// SOBEI Portal — TanStack Query Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDenunciasPorStatus,
  fetchDenunciaDetalhes,
  atualizarDenuncia,
  fetchEstatisticas,
  consultarProtocolo,
} from '@/lib/api';

// Buscar denúncias por status
export function useDenuncias(status, filtros = {}) {
  return useQuery({
    queryKey: ['denuncias', status, filtros],
    queryFn: () => fetchDenunciasPorStatus(status, filtros),
    staleTime: 30000,
  });
}

// Buscar detalhes de uma denúncia
export function useDenunciaDetalhes(id) {
  return useQuery({
    queryKey: ['denuncia', id],
    queryFn: () => fetchDenunciaDetalhes(id),
    enabled: !!id,
  });
}

// Atualizar denúncia (mutation)
export function useAtualizarDenuncia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await atualizarDenuncia(id, data);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Erro ao atualizar denúncia');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['denuncias'] });
      queryClient.invalidateQueries({ queryKey: ['denuncia'] });
    },
  });
}

// Buscar estatísticas
export function useEstatisticas(filtros = {}) {
  return useQuery({
    queryKey: ['estatisticas', filtros],
    queryFn: () => fetchEstatisticas(filtros),
    staleTime: 60000,
  });
}

// Consultar protocolo (público)
export function useConsultarProtocolo(protocolo) {
  return useQuery({
    queryKey: ['protocolo', protocolo],
    queryFn: () => consultarProtocolo(protocolo),
    enabled: !!protocolo && protocolo.length >= 5,
    staleTime: 10000,
  });
}
