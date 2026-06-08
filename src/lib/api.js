// ============================================
// SOBEI Portal — Mock API Functions
// ============================================

import { MOCK_DENUNCIAS, MOCK_STATS_POR_UNIDADE, MOCK_STATS_DISTRIBUICAO } from './mockData';

// Simula delay de rede
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Gera protocolo aleatório
function gerarProtocolo() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letras[Math.floor(Math.random() * 26)];
  const l2 = letras[Math.floor(Math.random() * 26)];
  const l3 = letras[Math.floor(Math.random() * 26)];
  const n1 = String(Math.floor(Math.random() * 900) + 100);
  const n2 = String(Math.floor(Math.random() * 900) + 100);
  return `${l1}${l2}${l3}-${n1}-${n2}`;
}

// ---- API Pública ----

export async function enviarDenuncia(data) {
  await delay(800);
  const protocolo = gerarProtocolo();
  return { protocolo, success: true };
}

export async function consultarProtocolo(protocolo) {
  await delay(600);
  const denuncia = MOCK_DENUNCIAS.find(
    (d) => d.protocolo.toLowerCase() === protocolo.toLowerCase()
  );

  if (!denuncia) {
    return { found: false, protocolo, status: null, timeline: [] };
  }

  const statusMap = {
    na_fila: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: false },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: false },
      { label: 'Protocolo fechado!', active: false },
    ],
    em_andamento: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: false },
      { label: 'Protocolo fechado!', active: false },
    ],
    fechada: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: true },
      { label: 'Protocolo fechado!', active: true },
    ],
    arquivada: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Denúncia arquivada', active: true },
      { label: 'Protocolo fechado!', active: false },
    ],
  };

  return {
    found: true,
    protocolo: denuncia.protocolo,
    status: denuncia.status,
    timeline: statusMap[denuncia.status] || [],
    // Dados do denunciante
    unidade: denuncia.unidade,
    tipo: denuncia.tipo,
    dataEnvio: denuncia.dataEnvio,
    descricao: denuncia.descricao,
    envolvidos: denuncia.envolvidos,
    testemunhas: denuncia.testemunhas,
    // Esclarecimento do admin
    medidasAdotadas: denuncia.medidasAdotadas || '',
  };
}

// ---- API Admin ----

export async function loginAdmin(credentials) {
  await delay(500);
  // Mock: aceita qualquer login/senha
  if (credentials.login && credentials.senha) {
    return { success: true, token: 'mock-jwt-token', user: { nome: credentials.login } };
  }
  return { success: false, message: 'Credenciais inválidas' };
}

export async function fetchDenunciasPorStatus(status, filtros = {}) {
  await delay(400);
  let denuncias = MOCK_DENUNCIAS.filter((d) => d.status === status);

  // Filtrar por tipo
  if (filtros.tipo) {
    denuncias = denuncias.filter((d) => d.tipo === filtros.tipo);
  }

  // Filtrar por unidade
  if (filtros.unidade) {
    denuncias = denuncias.filter((d) => d.unidade === filtros.unidade);
  }

  // Ordenar
  if (filtros.ordem === 'recentes') {
    denuncias = [...denuncias].reverse();
  }

  return denuncias;
}

export async function fetchDenunciaDetalhes(id) {
  await delay(300);
  return MOCK_DENUNCIAS.find((d) => d.id === id) || null;
}

export async function atualizarDenuncia(id, data) {
  await delay(500);
  const index = MOCK_DENUNCIAS.findIndex((d) => d.id === id);
  if (index >= 0) {
    Object.assign(MOCK_DENUNCIAS[index], data);
    return { success: true, denuncia: MOCK_DENUNCIAS[index] };
  }
  return { success: false };
}

export async function fetchEstatisticas(filtros = {}) {
  await delay(400);
  return {
    porUnidade: MOCK_STATS_POR_UNIDADE,
    distribuicao: MOCK_STATS_DISTRIBUICAO,
  };
}
