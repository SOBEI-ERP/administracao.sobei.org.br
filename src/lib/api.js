// ============================================
// SOBEI Portal — API Integration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

function unwrapPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return payload.denuncia || payload.dados || payload.data || payload;
}

function normalizeMedidas(value, asText = false) {
  if (!value) return asText ? null : [];

  const medidas = Array.isArray(value) ? value : [value];
  const normalized = medidas
    .map((medida, index) => {
      if (typeof medida === 'string') {
        return { id: `medida-${index}`, descricao: medida, dataRegistro: null };
      }

      if (!medida || typeof medida !== 'object') {
        return null;
      }

      return {
        id: medida.id ?? medida.medidaId ?? `medida-${index}`,
        descricao:
          medida.descricao ??
          medida.descricaoAcao ??
          medida.medida ??
          medida.texto ??
          '',
        dataRegistro: medida.dataRegistro ?? medida.criadoEm ?? medida.createdAt ?? null,
      };
    })
    .filter(Boolean);

  if (asText) {
    const text = normalized
      .map((medida) => medida.descricao)
      .filter(Boolean)
      .join('\n');
    return text || null;
  }

  return normalized;
}

function normalizeDenuncia(raw) {
  const denuncia = unwrapPayload(raw);
  if (!denuncia || typeof denuncia !== 'object') return denuncia;

  const denunciante = denuncia.denunciante || denuncia.denuncianteIdentificado || denuncia.denunciante_identificado || {};
  const conclusao = denuncia.conclusao || denuncia.conclusaoDenuncia || denuncia.conclusao_denuncia || {};

  return {
    ...denuncia,
    id: denuncia.id ?? denuncia.denunciaId,
    protocolo: denuncia.protocolo ?? denuncia.numeroProtocolo ?? denuncia.numero_protocolo,
    status: denuncia.status ?? denuncia.estado,
    tipo: denuncia.tipo ?? denuncia.tipoDenuncia ?? denuncia.tipo_denuncia,
    unidade: denuncia.unidade ?? denuncia.unidadeOcorrencia ?? denuncia.unidade_ocorrencia,
    dataEnvio:
      denuncia.dataEnvio ??
      denuncia.data_envio ??
      denuncia.dataCriacao ??
      denuncia.data_criacao ??
      denuncia.criadoEm ??
      denuncia.criado_em ??
      denuncia.createdAt ??
      denuncia.created_at ??
      denuncia.dataAbertura,
    dataAbertura:
      denuncia.dataAbertura ??
      denuncia.data_abertura ??
      denuncia.dataInicioApuracao ??
      denuncia.data_inicio_apuracao ??
      denuncia.dataEmAndamento,
    ultimaAlteracao: denuncia.ultimaAlteracao ?? denuncia.ultima_alteracao ?? denuncia.atualizadoEm ?? denuncia.atualizado_em ?? denuncia.updatedAt ?? denuncia.updated_at,
    dataFechamento:
      denuncia.dataFechamento ??
      denuncia.data_fechamento ??
      denuncia.dataConclusao ??
      denuncia.data_conclusao ??
      conclusao.dataConclusao,
    dataArquivamento:
      denuncia.dataArquivamento ??
      denuncia.data_arquivamento ??
      denuncia.dataConclusao ??
      denuncia.data_conclusao ??
      conclusao.dataConclusao,
    descricao:
      denuncia.descricao ??
      denuncia.descricaoDenuncia ??
      denuncia.descricao_denuncia ??
      denuncia.relato ??
      denuncia.detalhes ??
      '',
    envolvidos:
      denuncia.envolvidos ??
      denuncia.pessoasEnvolvidas ??
      denuncia.pessoas_envolvidas ??
      denuncia.quemEstavaEnvolvido ??
      denuncia.quem_estava_envolvido ??
      '',
    testemunhas:
      denuncia.testemunhas ??
      denuncia.quemTestemunhou ??
      denuncia.quem_testemunhou ??
      denuncia.testemunhasFatos ??
      denuncia.testemunhas_fatos ??
      '',
    nomeDenunciante:
      denuncia.nomeDenunciante ??
      denuncia.nome_denunciante ??
      denuncia.nomeCompleto ??
      denuncia.nome_completo ??
      denuncia.nome ??
      denunciante.nomeCompleto ??
      denunciante.nome_completo ??
      denunciante.nome ??
      '',
    emailDenunciante:
      denuncia.emailDenunciante ??
      denuncia.email_denunciante ??
      denuncia.email ??
      denunciante.email ??
      '',
    telefoneDenunciante:
      denuncia.telefoneDenunciante ??
      denuncia.telefone_denunciante ??
      denuncia.telefone ??
      denunciante.telefone ??
      '',
    medidasAdotadas: normalizeMedidas(
      denuncia.medidasAdotadas ?? denuncia.medidas_adotadas ?? denuncia.medidas ?? denuncia.historicoMedidas ?? denuncia.historico_medidas
    ),
    relatorioConclusao:
      denuncia.relatorioConclusao ??
      denuncia.relatorio_conclusao ??
      denuncia.relatorioFinal ??
      denuncia.relatorio_final ??
      denuncia.relatorioArquivamento ??
      denuncia.relatorio_arquivamento ??
      conclusao.relatorio ??
      '',
    tipoConclusao:
      denuncia.tipoConclusao ??
      denuncia.tipo_conclusao ??
      conclusao.tipoConclusao ??
      conclusao.tipo_conclusao ??
      null,
    prioridade: (denuncia.prioridade ?? 'NEUTRA').toUpperCase(),
  };
}

function normalizeDenunciasList(raw) {
  const list = Array.isArray(raw)
    ? raw
    : raw?.content || raw?.items || raw?.denuncias || raw?.data || [];

  return Array.isArray(list) ? list.map(normalizeDenuncia) : [];
}

function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('sobei_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ---- API Pública ----

export async function enviarDenuncia(rawData) {
  try {
    const data = { ...rawData };

    if (data.tipo === 'anonima') {
      delete data.nomeCompleto;
      delete data.email;
      delete data.telefone;
    } else {
      if (!data.nomeCompleto || typeof data.nomeCompleto !== 'string' || !data.nomeCompleto.trim()) {
        data.nomeCompleto = null;
      }
      if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
        data.email = null;
      }
      if (!data.telefone || typeof data.telefone !== 'string' || !data.telefone.trim()) {
        data.telefone = null;
      }
    }

    if (!data.envolvidos || typeof data.envolvidos !== 'string' || !data.envolvidos.trim()) {
      data.envolvidos = null;
    }
    if (!data.testemunhas || typeof data.testemunhas !== 'string' || !data.testemunhas.trim()) {
      data.testemunhas = null;
    }

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
    const response = await fetch(`${API_BASE_URL}/public/denuncias/protocolo/${protocolo}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      return { found: false, protocolo, status: null, timeline: [] };
    }
    
    const result = unwrapPayload(await response.json());
    const estado = result.estado ?? result.status;
    // A API já envia estado e ultimaAlteracao, simularemos a timeline visual com base no estado retornado
    const timeline = buildTimeline(estado ? estado.toUpperCase() : '');
    
    return {
      found: true,
      protocolo: result.protocolo,
      status: estado ? estado.toLowerCase() : null,
      timeline: timeline,
      dataEnvio: result.dataEnvio ?? result.dataAbertura ?? result.criadoEm,
      unidade: result.unidade,
      tipo: result.tipo,
      descricao: result.descricao ?? result.relato ?? '',
      envolvidos: result.envolvidos ?? result.pessoasEnvolvidas ?? '',
      testemunhas: result.testemunhas ?? '',
      relatorioConclusao: result.relatorioConclusao ?? result.relatorioFinal ?? result.relatorioArquivamento,
      tipoConclusao: result.tipoConclusao ?? result.conclusao?.tipoConclusao,
    };
  } catch (error) {
    return { found: false, protocolo, status: null, timeline: [] };
  }
}

function buildTimeline(estado) {
  const statusMap = {
    NA_FILA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: false },
      { label: 'Protocolo fechado!', active: false },
    ],
    EM_ANDAMENTO: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Protocolo fechado!', active: false },
    ],
    FECHADA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Protocolo fechado!', active: true },
    ],
    ARQUIVADA: [
      { label: 'Denúncia recebida!', active: true },
      { label: 'Sua denúncia está sendo analisada', active: true },
      { label: 'Denúncia arquivada', active: true },
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
      credentials: 'include',
      // Backend espera 'usuario' e não 'login' no Request
      body: JSON.stringify({ usuario: credentials.login, senha: credentials.senha }),
    });

    if (!response.ok) {
      return { success: false, message: 'Credenciais inválidas ou erro no servidor' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function fetchDenunciasPorStatus(status, filtros = {}) {
  try {
    let url = new URL(`${API_BASE_URL}/admin/denuncias`);
    if (status) {
      url.searchParams.append('status', status.toUpperCase());
    }
    
    if (filtros.tipo) url.searchParams.append('tipo', filtros.tipo.toUpperCase());
    if (filtros.unidade) url.searchParams.append('unidade', filtros.unidade);
    if (filtros.ordem) url.searchParams.append('ordem', filtros.ordem);
    if (filtros.prioridadeOrdem) url.searchParams.append('prioridadeOrdem', filtros.prioridadeOrdem);
    if (filtros.protocolo) url.searchParams.append('protocolo', filtros.protocolo.trim());
    if (filtros.dataInicio) url.searchParams.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) url.searchParams.append('dataFim', filtros.dataFim);

    const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
    
    if (!response.ok) {
      if(response.status === 401 || response.status === 403) {
        throw new Error('Não autorizado. Refaça o login.');
      }
      return [];
    }

    const data = await response.json();
    return normalizeDenunciasList(data);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function fetchDenunciaDetalhes(protocolo) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/denuncias/${protocolo}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) return null;
    return normalizeDenuncia(await response.json());
  } catch (error) {
    return null;
  }
}

export async function atualizarDenuncia(protocolo, payload) {
  try {
    // Backend espera AtualizarDenunciaRequest
    const requestData = {
      status: payload.status.toUpperCase(),
    };
    if (payload.descricaoAcao) requestData.descricaoAcao = payload.descricaoAcao;
    if (payload.medidas) {
      requestData.medidas = payload.medidas.map(m => {
        const idVal = m.id;
        const isNumeric = typeof idVal === 'number' || (typeof idVal === 'string' && !isNaN(Number(idVal)) && !idVal.startsWith('medida-'));
        return {
          id: isNumeric ? Number(idVal) : null,
          descricao: m.descricao
        };
      });
    }
    if (payload.relatorio) requestData.relatorio = payload.relatorio;
    if (payload.tipoConclusao) requestData.tipoConclusao = payload.tipoConclusao.toUpperCase();
    if (payload.prioridade) requestData.prioridade = payload.prioridade.toLowerCase();

    const response = await fetch(`${API_BASE_URL}/admin/denuncias/${protocolo}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao atualizar denúncia' };
    }

    const data = await response.json();
    return { success: true, denuncia: normalizeDenuncia(data) };
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
      credentials: 'include',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function fetchUsuarios() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/usuarios`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
}

export async function criarUsuario(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao criar usuário' };
    }

    const data = await response.json();
    return { success: true, usuario: data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function alterarSenhaUsuario(id, senha) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/usuarios/${id}/senha`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ senha }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao alterar senha' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function deletarUsuario(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.message || 'Erro ao deletar usuário' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro de conexão' };
  }
}

export async function logoutAdmin() {
  try {
    await fetch(`${API_BASE_URL}/admin/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro ao encerrar sessão' };
  }
}

export async function fetchMe() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}
