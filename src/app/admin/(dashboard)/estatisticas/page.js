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

const buildEvolucaoReal = (denuncias = []) => {
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const counts = {};
  const now = new Date();
  const monthsToPrint = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${mesesNomes[d.getMonth()]}/${d.getFullYear().toString().substr(-2)}`;
    monthsToPrint.push(key);
    counts[key] = 0;
  }

  denuncias.forEach(den => {
    const date = parseDate(den.dataEnvio);
    if (date) {
      const key = `${mesesNomes[date.getMonth()]}/${date.getFullYear().toString().substr(-2)}`;
      if (counts[key] === undefined) {
        counts[key] = 0;
        monthsToPrint.push(key);
      }
      counts[key]++;
    }
  });

  const sortedMonths = monthsToPrint.sort((a, b) => {
    const [aMes, aAno] = a.split('/');
    const [bMes, bAno] = b.split('/');
    const aIdx = mesesNomes.indexOf(aMes) + parseInt(aAno) * 12;
    const bIdx = mesesNomes.indexOf(bMes) + parseInt(bAno) * 12;
    return aIdx - bIdx;
  });

  const finalMonths = sortedMonths.slice(-12);
  return finalMonths.map(key => ({ data: key, total: counts[key] }));
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
        <title>Relatório de Estatísticas - SOBEI</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2A1F8A;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-title h1 {
            color: #2A1F8A;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            font-style: italic;
          }
          .logo-title p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .meta-info {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          .section-title {
            color: #1B1464;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .filters-summary {
            background-color: #f8f9fa;
            border: 1px solid #eaeaea;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            font-size: 14px;
          }
          .filters-summary table {
            width: 100%;
            border-collapse: collapse;
          }
          .filters-summary td {
            padding: 4px 8px;
          }
          .filters-summary td strong {
            color: #2A1F8A;
          }
          .kpi-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background-color: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            border-left: 4px solid #2A1F8A;
          }
          .kpi-card.accent { border-left-color: #FF7043; }
          .kpi-card.green { border-left-color: #43A047; }
          .kpi-card__title {
            font-size: 11px;
            color: #718096;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .kpi-card__value {
            font-size: 24px;
            font-weight: bold;
            color: #1A202C;
          }
          .kpi-card__desc {
            font-size: 11px;
            color: #718096;
            margin-top: 3px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: left;
          }
          table.data-table th {
            background-color: #f7fafc;
            color: #4a5568;
            font-weight: bold;
            font-size: 13px;
          }
          table.data-table td {
            font-size: 13px;
          }
          table.data-table tr:nth-child(even) td {
            background-color: #fcfcfc;
          }
          .highlight-box {
            background-color: #ebf8ff;
            border: 1px solid #bee3f8;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
          }
          .highlight-item {
            flex: 1;
            text-align: center;
          }
          .highlight-item:not(:last-child) {
            border-right: 1px solid #bee3f8;
          }
          .highlight-item__title {
            font-size: 12px;
            color: #2b6cb0;
            text-transform: uppercase;
            font-weight: bold;
          }
          .highlight-item__value {
            font-size: 18px;
            font-weight: bold;
            color: #2c5282;
            margin-top: 5px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #a0aec0;
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
            margin-bottom: 20px;
          }
          .btn-print {
            background-color: #2A1F8A;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #1B1464;
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container no-print">
          <button class="btn-print" onclick="window.print()">Imprimir / Salvar como PDF</button>
        </div>

        <div class="header">
          <div class="logo-title">
            <img src="${logoUrl}" alt="SOBEI Logo" style="height: 55px; width: auto; display: block; margin-bottom: 6px;" />
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Canal de Denúncias — Relatório Estatístico Oficial</p>
          </div>
          <div class="meta-info">
            <p><strong>Emitido em:</strong> ${dataEmissao}</p>
            <p><strong>Usuário:</strong> Administrador</p>
          </div>
        </div>

        <div class="filters-summary">
          <table>
            <tr>
              <td><strong>Filtro de Unidade:</strong> ${filtroUnidadeText}</td>
              <td><strong>Filtro de Tipo:</strong> ${filtroTipoText}</td>
            </tr>
            <tr>
              <td colspan="2"><strong>Período Analisado:</strong> ${filtroPeriodoText}</td>
            </tr>
          </table>
        </div>

        <div class="section-title">Resumo Estatístico Geral</div>
        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-card__title">Total de Manifestações</div>
            <div class="kpi-card__value">${totalDenuncias}</div>
            <div class="kpi-card__desc">Total registrado no período</div>
          </div>
          <div class="kpi-card accent">
            <div class="kpi-card__title">Taxa de Anonimato</div>
            <div class="kpi-card__value">${taxaAnonimato}%</div>
            <div class="kpi-card__desc">${anonimas} anônimas, ${identificadas} identificadas</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-card__title">Casos Resolvidos</div>
            <div class="kpi-card__value">${resolvidos}</div>
            <div class="kpi-card__desc">Concluídos com sucesso</div>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-card__title">Casos na Fila (Triagem)</div>
            <div class="kpi-card__value">${fila}</div>
            <div class="kpi-card__desc">Aguardando análise inicial</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__title">Casos em Resolução</div>
            <div class="kpi-card__value">${emAndamento}</div>
            <div class="kpi-card__desc">Investigação em andamento</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__title">Casos Arquivados</div>
            <div class="kpi-card__value">${arquivados}</div>
            <div class="kpi-card__desc">Sem evidências / duplicados</div>
          </div>
        </div>

        <div class="section-title">Análise de Destaques por Unidade</div>
        <div class="highlight-box">
          <div class="highlight-item">
            <div class="highlight-item__title">Unidade com Mais Denúncias</div>
            <div class="highlight-item__value">${maxUnidade ? `${maxUnidade.unidade} (${maxUnidade.total})` : 'Nenhuma'}</div>
          </div>
          <div class="highlight-item">
            <div class="highlight-item__title">Unidade com Menos Denúncias</div>
            <div class="highlight-item__value">${minUnidade ? `${minUnidade.unidade} (${minUnidade.total})` : 'Nenhuma'}</div>
          </div>
        </div>

        <div class="section-title">Comparativo Entre Todas as Unidades</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Unidade</th>
              <th>Total de Denúncias</th>
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
          <div class="section-title">Evolução Mensal / Período</div>
          <table class="data-table" style="max-width: 500px;">
            <thead>
              <tr>
                <th>Período</th>
                <th>Total de Denúncias</th>
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
          <p>© SOBEI — Relatório Confidencial gerado eletronicamente para fins de auditoria interna.</p>
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

  const evolucaoData = buildEvolucaoReal(todasDenuncias || []);

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

          {/* Card 3: Na Fila */}
          <div className="kpi-card kpi-card--orange">
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Casos na Fila</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Aguardando Análise')?.value || 0}
            </span>
            <span className="kpi-card__desc">Aguardando triagem</span>
          </div>

          {/* Card 4: Em Resolução */}
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

          {/* Card 5: Resolvidos */}
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

          {/* Card 6: Arquivados */}
          <div className="kpi-card kpi-card--gray" style={{ '--color-primary': 'var(--color-gray-600)' }}>
            <div className="kpi-card__header">
              <span className="kpi-card__title" style={{ textTransform: 'uppercase' }}>Casos Arquivados</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M21 8v13H3V8"></path><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Arquivada')?.value || 0}
            </span>
            <span className="kpi-card__desc">Sem evidências / duplicados</span>
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

          {/* Coluna 2: Pie Chart de Unidades */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title" style={{ padding: '0 var(--spacing-md)' }}>Distribuição por Unidade:</h2>
            <div className="statistics-chart__wrapper" style={{ padding: '10px 0', minHeight: '300px' }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="percentual"
                      nameKey="unidade"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={renderCustomLabel}
                    >
                      {pieData.map((entry, index) => (
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
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '40px 0' }}>Sem dados para exibir</p>
              )}
            </div>
            <div className="chart-explanation-card" style={{ margin: '16px' }}>
              <p className="chart-explanation-card__text">
                <strong>O que este gráfico mostra:</strong> A proporção percentual de denúncias distribuídas entre as unidades. 
                Visualizar os dados em percentual ajuda a entender rapidamente quais locais representam a maior fatia das ocorrências reportadas no período.
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
