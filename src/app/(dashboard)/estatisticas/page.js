'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '@/components/admin/CustomSelect';
import CustomDatePicker from '@/components/admin/CustomDatePicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useEstatisticas, useTodasDenuncias } from '@/hooks/useDenuncias';
import { UNIDADES } from '@/lib/mockData';

const CORES_PIE = ['#7C6BC4', '#FF7043', '#43A047', '#FFB74D', '#9C8FD9', '#E53935'];

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const buildEvolucaoReal = (denuncias = [], dataFim = null) => {
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const dates = denuncias
    .map(d => parseDate(d.dataEnvio))
    .filter(Boolean);

  if (dates.length === 0) {
    const now = new Date();
    const key = `${mesesNomes[now.getMonth()]}/${now.getFullYear().toString().substr(-2)}`;
    return [{ data: key, total: 0 }];
  }

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  let maxDate = new Date();
  if (dataFim) {
    const parsedFim = parseDate(dataFim);
    if (parsedFim) {
      maxDate = parsedFim;
    }
  }

  if (maxDate < minDate) {
    maxDate = new Date(minDate.getTime());
  }

  const diffYears = maxDate.getFullYear() - minDate.getFullYear();
  const diffMonths = (diffYears * 12) + (maxDate.getMonth() - minDate.getMonth()) + 1;

  const monthsToPrint = [];
  const counts = {};

  if (diffMonths < 6) {
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    
    let current = new Date(start.getTime());
    while (current <= end) {
      const key = `${current.getDate().toString().padStart(2, '0')}/${mesesNomes[current.getMonth()]}`;
      monthsToPrint.push(key);
      counts[key] = 0;
      current.setDate(current.getDate() + 1);
    }

    denuncias.forEach(den => {
      const date = parseDate(den.dataEnvio);
      if (date) {
        const key = `${date.getDate().toString().padStart(2, '0')}/${mesesNomes[date.getMonth()]}`;
        if (counts[key] !== undefined) {
          counts[key]++;
        }
      }
    });
  } else {
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    let current = new Date(start.getTime());
    while (current <= end) {
      const key = `${mesesNomes[current.getMonth()]}/${current.getFullYear().toString().substr(-2)}`;
      monthsToPrint.push(key);
      counts[key] = 0;
      current.setMonth(current.getMonth() + 1);
    }

    denuncias.forEach(den => {
      const date = parseDate(den.dataEnvio);
      if (date) {
        const key = `${mesesNomes[date.getMonth()]}/${date.getFullYear().toString().substr(-2)}`;
        if (counts[key] !== undefined) {
          counts[key]++;
        }
      }
    });
  }

  return monthsToPrint.map(key => ({ data: key, total: counts[key] }));
};

export default function EstatisticasPage() {
  const [mounted, setMounted] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    unidade: '',
    dataInicio: '',
    dataFim: '',
  });
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const { data: stats, isLoading: isStatsLoading } = useEstatisticas(filtros);
  const { data: todasDenuncias, isLoading: isDenunciasLoading } = useTodasDenuncias(filtros);
  const isLoading = isStatsLoading || isDenunciasLoading;

  if (!mounted) {
    return (
      <div>
        <h1 className="statistics-page__title">Estatísticas</h1>
        <p style={{ color: 'var(--color-gray-500)', padding: '24px 0' }}>Carregando...</p>
      </div>
    );
  }

  function handleAplicar() {
    if (filtros.unidade && !tags.includes(filtros.unidade)) {
      setTags([...tags, filtros.unidade]);
    }
  }

  function handleLimpar() {
    setFiltros({ tipo: '', unidade: '', dataInicio: '', dataFim: '' });
    setTags([]);
  }

  function handleRemoveTag(tag) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleExportRelatorio() {
    if (isLoading || !stats) return;

    const maxUnidade = barData.length > 0
      ? barData.reduce((prev, current) => (prev.total > current.total ? prev : current))
      : null;

    const minUnidade = barData.length > 0
      ? barData.reduce((prev, current) => (prev.total < current.total ? prev : current))
      : null;

    const sortedBarData = [...barData].sort((a, b) => b.total - a.total);

    const anonimas = tiposData.find(t => t.name === 'Anônima')?.value || 0;
    const identificadas = tiposData.find(t => t.name === 'Identificada')?.value || 0;
    const taxaAnonimato = totalDenuncias > 0 ? ((anonimas / totalDenuncias) * 100).toFixed(1) : '0.0';

    const fila = statusData.find(s => s.name === 'Aguardando Análise')?.value || 0;
    const emAndamento = statusData.find(s => s.name === 'Em Andamento')?.value || 0;
    const resolvidos = statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0;
    const arquivados = statusData.find(s => s.name === 'Arquivada')?.value || 0;

    const filtroTipoText = filtros.tipo === 'anonima' ? 'Anônimas' : filtros.tipo === 'identificada' ? 'Identificadas' : 'Todos';
    const filtroUnidadeText = filtros.unidade || 'Todas unidades';
    const filtroPeriodoText = (filtros.dataInicio || filtros.dataFim)
      ? `${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Fim'}`
      : 'Todo o histórico';

    const logoUrl = window.location.origin + '/images/LOGO AZUL.png';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para exportar o relatório.');
      return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Estatístico Executivo - SOBEI</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2D3748;
            margin: 0;
            padding: 20px;
            background-color: #fff;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1B1464;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo-title img {
            height: 50px;
            width: auto;
            display: block;
            margin-bottom: 6px;
          }
          .logo-title p {
            margin: 4px 0 0 0;
            color: #4A5568;
            font-size: 13px;
            font-weight: 500;
          }
          .meta-info {
            text-align: right;
            font-size: 12px;
            color: #718096;
          }
          .section-title {
            color: #1B1464;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 6px;
            margin-top: 28px;
            margin-bottom: 16px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: bold;
            page-break-after: avoid;
          }
          .filters-summary {
            background-color: #F7FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 13px;
          }
          .filters-summary table {
            width: 100%;
            border-collapse: collapse;
          }
          .filters-summary td {
            padding: 4px 8px;
          }
          .filters-summary td strong {
            color: #1B1464;
          }
          .kpi-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .kpi-card {
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 12px 14px;
            background-color: #fff;
            border-left: 4px solid #1B1464;
          }
          .kpi-card.accent { border-left-color: #7C6BC4; }
          .kpi-card.green { border-left-color: #43A047; }
          .kpi-card.orange { border-left-color: #FF7043; }
          .kpi-card__title {
            font-size: 10px;
            color: #718096;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .kpi-card__value {
            font-size: 22px;
            font-weight: bold;
            color: #1A202C;
          }
          .kpi-card__desc {
            font-size: 11px;
            color: #718096;
            margin-top: 2px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #E2E8F0;
            padding: 8px 12px;
            text-align: left;
          }
          table.data-table th {
            background-color: #EDF2F7;
            color: #2D3748;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          table.data-table td {
            font-size: 12px;
          }
          table.data-table tr:nth-child(even) td {
            background-color: #F7FAFC;
          }
          .highlight-box {
            background-color: #EBF8FF;
            border: 1px solid #BEE3F8;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .highlight-item {
            flex: 1;
            text-align: center;
          }
          .highlight-item:not(:last-child) {
            border-right: 1px solid #BEE3F8;
          }
          .highlight-item__title {
            font-size: 11px;
            color: #2B6CB0;
            text-transform: uppercase;
            font-weight: bold;
          }
          .highlight-item__value {
            font-size: 16px;
            font-weight: bold;
            color: #2C5282;
            margin-top: 4px;
          }
          .flex-tables {
            display: flex;
            gap: 20px;
            page-break-inside: avoid;
          }
          .flex-tables > div {
            flex: 1;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            text-align: center;
            font-size: 10px;
            color: #A0AEC0;
            page-break-inside: avoid;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .print-btn-container {
            text-align: right;
            margin-bottom: 16px;
          }
          .btn-print {
            background-color: #1B1464;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #2A1F8A;
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container no-print">
          <button class="btn-print" onclick="window.print()">Imprimir / Salvar como PDF</button>
        </div>

        <div class="header">
          <div class="logo-title">
            <img src="${logoUrl}" alt="SOBEI Logo" />
            <p>Canal de Denúncias — Relatório Estatístico Executivo de Compliance</p>
          </div>
          <div class="meta-info">
            <p><strong>Emitido em:</strong> ${dataEmissao}</p>
            <p><strong>Emissor:</strong> Painel Administrativo SOBEI</p>
          </div>
        </div>

        <div class="filters-summary">
          <table>
            <tr>
              <td><strong>Unidade:</strong> ${filtroUnidadeText}</td>
              <td><strong>Tipo de Manifestação:</strong> ${filtroTipoText}</td>
            </tr>
            <tr>
              <td colspan="2"><strong>Período de Análise:</strong> ${filtroPeriodoText}</td>
            </tr>
          </table>
        </div>

        <div class="section-title">Indicadores Globais de Desempenho</div>
        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-card__title">Total de Manifestações</div>
            <div class="kpi-card__value">${totalDenuncias}</div>
            <div class="kpi-card__desc">Registros no período</div>
          </div>
          <div class="kpi-card accent">
            <div class="kpi-card__title">Taxa de Anonimato</div>
            <div class="kpi-card__value">${taxaAnonimato}%</div>
            <div class="kpi-card__desc">${anonimas} anônimas, ${identificadas} identificadas</div>
          </div>
          <div class="kpi-card accent">
            <div class="kpi-card__title">Tempo Médio de Resolução (SLA)</div>
            <div class="kpi-card__value">${mediaDiasResolucao ? `${mediaDiasResolucao} dias` : '—'}</div>
            <div class="kpi-card__desc">Média até fechamento</div>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card orange">
            <div class="kpi-card__title">Em Triagem (Fila)</div>
            <div class="kpi-card__value">${fila}</div>
            <div class="kpi-card__desc">Aguardando análise inicial</div>
          </div>
          <div class="kpi-card orange">
            <div class="kpi-card__title">Em Resolução</div>
            <div class="kpi-card__value">${emAndamento}</div>
            <div class="kpi-card__desc">Investigação ativa</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-card__title">Resolutividade Operacional</div>
            <div class="kpi-card__value">${taxaResolutividade}%</div>
            <div class="kpi-card__desc">${resolvidos} resolvidos vs ${arquivados} arquivados</div>
          </div>
        </div>

        <div class="section-title">Destaques por Unidade</div>
        <div class="highlight-box">
          <div class="highlight-item">
            <div class="highlight-item__title">Unidade com Maior Incidência</div>
            <div class="highlight-item__value">${maxUnidade ? `${maxUnidade.unidade} (${maxUnidade.total})` : 'Nenhuma'}</div>
          </div>
          <div class="highlight-item">
            <div class="highlight-item__title">Unidade com Menor Incidência</div>
            <div class="highlight-item__value">${minUnidade ? `${minUnidade.unidade} (${minUnidade.total})` : 'Nenhuma'}</div>
          </div>
        </div>

        <div class="flex-tables">
          <div>
            <div class="section-title" style="margin-top:0;">Tipo de Manifestação</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Proporção</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Anônima</td>
                  <td>${anonimas}</td>
                  <td>${totalDenuncias > 0 ? ((anonimas / totalDenuncias) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr>
                  <td>Identificada</td>
                  <td>${identificadas}</td>
                  <td>${totalDenuncias > 0 ? ((identificadas / totalDenuncias) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div class="section-title" style="margin-top:0;">Gravidade / Prioridades</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Prioridade</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                ${prioridadesData.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="section-title">Detalhamento Completo por Unidade</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Unidade Escolar / Setor</th>
              <th>Total de Manifestações</th>
              <th>Participação (%)</th>
            </tr>
          </thead>
          <tbody>
            ${sortedBarData.map((item, index) => {
              const part = totalDenuncias > 0 ? ((item.total / totalDenuncias) * 100).toFixed(1) : '0.0';
              return `
                <tr>
                  <td><strong>${index + 1}º</strong></td>
                  <td>${item.unidade}</td>
                  <td>${item.total}</td>
                  <td>${part}%</td>
                </tr>
              `;
            }).join('')}
            ${sortedBarData.length === 0 ? `<tr><td colspan="4" style="text-align: center;">Nenhum dado registrado para o período.</td></tr>` : ''}
          </tbody>
        </table>

        ${evolucaoData.length > 0 ? `
          <div class="section-title">Histórico de Evolução Temporal</div>
          <table class="data-table" style="max-width: 450px;">
            <thead>
              <tr>
                <th>Período</th>
                <th>Manifestações Registradas</th>
              </tr>
            </thead>
            <tbody>
              ${evolucaoData.map(item => `
                <tr>
                  <td>${item.data}</td>
                  <td>${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p>© SOBEI — Relatório Oficial de Compliance e Ouvidoria gerado automaticamente para fins de gestão interna.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }


  const barData = stats?.porUnidade
    ? Object.entries(stats.porUnidade).map(([unidade, total]) => ({ unidade, total }))
    : [];

  const totalDenuncias = barData.reduce((acc, curr) => acc + curr.total, 0);
  const pieData = totalDenuncias > 0
    ? barData.map((item, idx) => ({
        unidade: item.unidade,
        percentual: parseFloat(((item.total / totalDenuncias) * 100).toFixed(1)),
        cor: CORES_PIE[idx % CORES_PIE.length]
      }))
    : [];

  const tiposData = stats?.distribuicao?.tipos
    ? stats.distribuicao.tipos.map((item, idx) => ({
        name: item.name === 'ANONIMA' ? 'Anônima' : 'Identificada',
        value: item.value,
        cor: idx === 0 ? '#7C6BC4' : '#FF7043',
      }))
    : [];

  const statusData = stats?.distribuicao?.status
    ? stats.distribuicao.status.map((item) => {
        const statusNames = {
          NA_FILA: 'Aguardando Análise',
          EM_ANDAMENTO: 'Em Andamento',
          FECHADA: 'Protocolo Fechado',
          ARQUIVADA: 'Arquivada',
        };
        return {
          name: statusNames[item.name] || item.name,
          value: item.value,
        };
      })
    : [];

  const prioridadesData = stats?.distribuicao?.prioridades
    ? stats.distribuicao.prioridades.map((item) => {
        const priorityLabels = {
          NEUTRA: 'Neutra',
          BAIXA: 'Baixa',
          MEDIA: 'Média',
          ALTA: 'Alta',
        };
        const priorityColors = {
          NEUTRA: '#9E9E9E',
          BAIXA: '#43A047',
          MEDIA: '#FF9800',
          ALTA: '#E53935',
        };
        return {
          name: priorityLabels[item.name] || item.name,
          value: item.value,
          cor: priorityColors[item.name] || '#9E9E9E',
        };
      })
    : [];

  // Custom label for pie chart
  const renderCustomLabel = ({ unidade, percentual, x, y }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#333">
      {`${percentual}%`}
    </text>
  );

  const renderPriorityLabel = ({ name, percent, x, y }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#333">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );

  const evolucaoData = buildEvolucaoReal(todasDenuncias || [], filtros.dataFim);

  const fechadasCount = statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0;
  const arquivadasCount = statusData.find(s => s.name === 'Arquivada')?.value || 0;
  const totalEncerradas = fechadasCount + arquivadasCount;
  const taxaResolutividade = totalEncerradas > 0 ? ((fechadasCount / totalEncerradas) * 100).toFixed(1) : '100.0';

  const mediaDiasResolucao = (() => {
    if (!todasDenuncias || todasDenuncias.length === 0) return null;
    const fechadas = todasDenuncias.filter(d => (d.status === 'fechada' || d.status === 'FECHADA'));
    if (fechadas.length === 0) return null;

    let totalDias = 0;
    let count = 0;
    fechadas.forEach(d => {
      const dInicio = parseDate(d.dataEnvio || d.dataAbertura);
      const dFim = parseDate(d.dataFechamento || d.ultimaAlteracao);
      if (dInicio && dFim && dFim >= dInicio) {
        const diffMs = Math.abs(dFim - dInicio);
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        totalDias += diffDays;
        count++;
      }
    });

    return count > 0 ? (totalDias / count).toFixed(1) : null;
  })();

  return (
    <div className="statistics-container">
      {/* Header Actions */}
      <div className="statistics-header">
        <h1 className="statistics-page__title">Estatísticas</h1>
        <button 
          className="btn btn--secondary" 
          type="button" 
          id="btn-gerar-relatorio"
          onClick={handleExportRelatorio}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar relatório
        </button>
      </div>

      {/* Filters */}
      <div className="statistics-filters-glass">
        <div className="statistics-filters">
          <div className="statistics-filters__group">
            <span className="statistics-filters__label">Tipo de denúncia:</span>
            <CustomSelect
              style={{ minWidth: '220px' }}
              value={filtros.tipo}
              onChange={(val) => setFiltros({ ...filtros, tipo: val })}
              defaultOption="Todos"
              options={[
                { value: 'anonima', label: 'Denúncia anônima' },
                { value: 'identificada', label: 'Denúncia identificada' }
              ]}
            />
          </div>

          <div className="statistics-filters__group">
            <span className="statistics-filters__label">Em qual unidade ocorreu?</span>
            <CustomSelect
              style={{ minWidth: '200px' }}
              value={filtros.unidade}
              onChange={(val) => setFiltros({ ...filtros, unidade: val })}
              defaultOption="Todas unidades"
              options={UNIDADES.map(u => ({ value: u, label: u }))}
            />
          </div>

          <div className="statistics-filters__group">
            <span className="statistics-filters__label">Período</span>
            <div className="statistics-filters__date-group">
              <CustomDatePicker
                style={{ minWidth: '160px' }}
                value={filtros.dataInicio}
                onChange={(val) => setFiltros({ ...filtros, dataInicio: val })}
                placeholder="Data inicial"
              />
              <span className="statistics-filters__date-sep">Até:</span>
              <CustomDatePicker
                style={{ minWidth: '160px' }}
                value={filtros.dataFim}
                onChange={(val) => setFiltros({ ...filtros, dataFim: val })}
                placeholder="Data final"
              />
            </div>
          </div>

          <div className="statistics-filters__actions">
            <button className="btn btn--limpar" onClick={handleLimpar} type="button">
              Limpar
            </button>
            <button className="btn btn--aplicar" onClick={handleAplicar} type="button">
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="statistics-tags">
          {tags.map((tag) => (
            <span className="statistics-tag" key={tag}>
              {tag}
              <button
                className="statistics-tag__remove"
                onClick={() => handleRemoveTag(tag)}
                type="button"
                aria-label={`Remover ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      {!isLoading && (
        <div className="statistics-kpis">
          {/* Card 1: Taxa de Anonimato */}
          <div className="kpi-card kpi-card--accent">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Taxa de Anonimato</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <span className="kpi-card__value">
              {totalDenuncias > 0
                ? `${((tiposData.find(t => t.name === 'Anônima')?.value || 0) / totalDenuncias * 100).toFixed(1)}%`
                : '0.0%'
              }
            </span>
            <span className="kpi-card__desc">Feitas de forma anônima</span>
          </div>

          {/* Card 2: Total de Manifestações */}
          <div className="kpi-card">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Total de Manifestações</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <span className="kpi-card__value">{totalDenuncias}</span>
            <span className="kpi-card__desc">Manifestações no período</span>
          </div>

          {/* Card 3: Tempo Médio de Resolução (SLA) */}
          <div className="kpi-card kpi-card--accent">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Tempo Médio (SLA)</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <span className="kpi-card__value">
              {mediaDiasResolucao ? `${mediaDiasResolucao} dias` : '—'}
            </span>
            <span className="kpi-card__desc">Tempo médio até conclusão</span>
          </div>

          {/* Card 4: Casos em Resolução */}
          <div className="kpi-card kpi-card--orange">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Casos em Resolução</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Em Andamento')?.value || 0}
            </span>
            <span className="kpi-card__desc">Sendo apurados</span>
          </div>

          {/* Card 5: Casos Resolvidos */}
          <div className="kpi-card kpi-card--green">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Casos Resolvidos</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0}
            </span>
            <span className="kpi-card__desc">Protocolos finalizados</span>
          </div>

          {/* Card 6: Taxa de Resolutividade */}
          <div className="kpi-card kpi-card--green">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Resolutividade</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span className="kpi-card__value">{taxaResolutividade}%</span>
            <span className="kpi-card__desc">Casos encerrados com solução</span>
          </div>
        </div>
      )}

      {/* Gráficos - Bento Grid */}
      {!isLoading ? (
        <div className="statistics-bento">
          {/* Coluna 1: Bar Chart */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title">Relação de denúncias por unidade:</h2>
            <div className="statistics-chart__wrapper" style={{ overflowX: 'auto', paddingRight: '10px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis
                    dataKey="unidade"
                    tick={{ fontSize: 11, fill: '#333' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#333' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(27, 20, 100, 0.04)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    activeBar={{ fill: '#7C6BC4', stroke: 'none', outline: 'none' }}
                    style={{ outline: 'none' }}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-explanation-card">
              <p className="chart-explanation-card__text">
                <strong>O que este gráfico mostra:</strong> A distribuição quantitativa de denúncias registradas em cada unidade escolar da SOBEI.
                Use estas informações para identificar recorrências geográficas e planejar ações preventivas direcionadas, como treinamentos de compliance e acolhimento específicos para cada localidade.
              </p>
            </div>
          </div>

          {/* Coluna 2: Donut Chart de Tipos de Manifestação */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title" style={{ padding: '0 var(--spacing-md)' }}>Distribuição por Tipo de Manifestação:</h2>
            <div className="statistics-chart__wrapper" style={{ padding: '10px 0', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tiposData.length > 0 && tiposData.some(t => t.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tiposData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    >
                      {tiposData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '40px 0' }}>Sem dados de tipo no período</p>
              )}
            </div>
            <div className="chart-explanation-card" style={{ margin: '16px' }}>
              <p className="chart-explanation-card__text">
                <strong>O que este gráfico mostra:</strong> A proporção de denúncias <strong>Anônimas</strong> vs <strong>Identificadas</strong>.
                Ajuda a monitorar a confiança da comunidade no anonimato do canal da SOBEI.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--color-gray-500)' }}>Carregando gráficos...</p>
      )}

      {/* Segunda Linha de Gráficos (Bento Grid) */}
      {!isLoading && (
        <div className="statistics-bento" style={{ marginTop: 'var(--spacing-xl)' }}>
          {/* Coluna 1: Evolução no Tempo (Line Chart) */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title">Evolução de Denúncias no Tempo:</h2>
            <div className="statistics-chart__wrapper" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="data" tick={{ fontSize: 12, fill: '#333' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#333' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(27, 20, 100, 0.1)', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#7C6BC4" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#7C6BC4', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, fill: '#FF7043', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-explanation-card">
              <p className="chart-explanation-card__text">
                <strong>O que este gráfico mostra:</strong> A tendência e o volume de denúncias ao longo do tempo. Este gráfico responde aos filtros globais de período e unidade definidos no topo.
              </p>
            </div>
          </div>

          {/* Coluna 2: Distribuição por Prioridade (Doughnut Chart) */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title">Distribuição por Prioridade:</h2>
            <div className="statistics-chart__wrapper" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {prioridadesData.length > 0 && prioridadesData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prioridadesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      label={renderPriorityLabel}
                    >
                      {prioridadesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '40px 0' }}>Sem dados de prioridade no período</p>
              )}
            </div>
            <div className="chart-explanation-card">
              <p className="chart-explanation-card__text">
                <strong>O que este gráfico mostra:</strong> A proporção de denúncias classificadas por prioridade. Auxilia a entender a carga de trabalho crítica (Alta/Média) vs rotineira (Baixa/Neutra).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
