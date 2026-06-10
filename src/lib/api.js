// ============================================
// SOBEI Portal — API Integration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

function getAuthHeaders() {
  const token = localStorage.getItem('sobei_token');
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

// ---- API Pública ----

export async function enviarDenuncia(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/denuncias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao enviar denúncia' };
    }

    const result = await response.json();
    return { protocolo: result.protocolo, success: true };
  } catch (error) {
    return { success: false, message: 'Erro de conexão com o servidor' };
  }
}

export async function consultarProtocolo(protocolo) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/denuncias/protocolo/${protocolo}`);
    if (!response.ok) {
      return { found: false, protocolo, status: null, timeline: [] };
    }
    
    const result = await response.json();
    // A API já envia estado e ultimaAlteracao, simularemos a timeline visual com base no estado retornado
    const timeline = buildTimeline(result.estado ? result.estado.toUpperCase() : '');
    
    return {
      found: true,
      protocolo: result.protocolo,
      status: result.estado.toLowerCase(),
      timeline: timeline,
      dataEnvio: result.dataAbertura,
      unidade: result.unidade,
      tipo: result.tipo,
      descricao: result.descricao,
      envolvidos: result.envolvidos,
      testemunhas: result.testemunhas,
      medidasAdotadas: result.historicoMedidas && result.historicoMedidas.length > 0 ? result.historicoMedidas.join('\n') : null,
    };
  } catch (error) {
    return { found: false, protocolo, status: null, timeline: [] };
  }
}

function buildTimeline(estado) {
  const statusMap = {
    ABERTA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: false },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: false },
      { label: 'Protocolo fechado!', active: false },
    ],
    EM_ANDAMENTO: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: false },
      { label: 'Protocolo fechado!', active: false },
    ],
    FECHADA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Sua denúncia foi apurada e em breve fecharemos o protocolo', active: true },
      { label: 'Protocolo fechado!', active: true },
    ],
    ARQUIVADA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Denúncia arquivada', active: true },
      { label: 'Protocolo fechado!', active: false },
    ],
  };
  return statusMap[estado] || [];
}


// ---- API Admin ----

export async function loginAdmin(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Backend espera 'usuario' e não 'login' no Request
      body: JSON.stringify({ usuario: credentials.login, senha: credentials.senha }),
    });

    if (!response.ok) {
      return { success: false, message: 'Credenciais inválidas ou erro no servidor' };
    }

    const data = await response.json();
    
    // Armazena token para usar nas próximas rotas
    if (data.token) {
      localStorage.setItem('sobei_token', data.token);
    }
    
    return data;
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function fetchDenunciasPorStatus(status, filtros = {}) {
  try {
    let url = new URL(`${API_BASE_URL}/admin/denuncias`);
    const mappedStatus = status === 'na_fila' ? 'aberta' : status;
    url.searchParams.append('status', mappedStatus.toUpperCase());
    
    if (filtros.tipo) url.searchParams.append('tipo', filtros.tipo.toUpperCase());
    if (filtros.unidade) url.searchParams.append('unidade', filtros.unidade);
    if (filtros.ordem) url.searchParams.append('ordem', filtros.ordem);

    const response = await fetch(url, { headers: getAuthHeaders() });
    
    if (!response.ok) {
      if(response.status === 401 || response.status === 403) {
        throw new Error('Não autorizado. Refaça o login.');
      }
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function fetchDenunciaDetalhes(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/denuncias/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function atualizarDenuncia(id, payload) {
  try {
    // Backend espera AtualizarDenunciaRequest
    const requestData = {
      status: payload.status.toUpperCase(),
    };
    if (payload.descricaoAcao) requestData.descricaoAcao = payload.descricaoAcao;
    if (payload.relatorio) requestData.relatorio = payload.relatorio;
    if (payload.tipoConclusao) requestData.tipoConclusao = payload.tipoConclusao.toUpperCase();

    const response = await fetch(`${API_BASE_URL}/admin/denuncias/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao atualizar denúncia' };
    }

    const data = await response.json();
    return { success: true, denuncia: data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function fetchEstatisticas(filtros = {}) {
  try {
    let url = new URL(`${API_BASE_URL}/admin/estatisticas`);
    if (filtros.tipo) url.searchParams.append('tipo', filtros.tipo);
    if (filtros.unidade) url.searchParams.append('unidade', filtros.unidade);
    if (filtros.dataInicio) url.searchParams.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) url.searchParams.append('dataFim', filtros.dataFim);

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}
