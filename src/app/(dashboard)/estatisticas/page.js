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
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useEstatisticas, useTodasDenuncias } from '@/hooks/useDenuncias';
import { UNIDADES } from '@/lib/mockData';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DenunciasHeatmap from '@/components/admin/DenunciasHeatmap';

const CORES_AZUIS = [
  '#1B1464', // Azul institucional SOBEI primário
  '#3B82F6', // Azul vibrante
  '#2563EB', // Azul royal
  '#60A5FA', // Azul suave
  '#1D4ED8', // Azul marinho
  '#93C5FD', // Azul pastel
  '#0284C7', // Azul oceano
  '#38BDF8', // Azul celeste
];

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
  const { user } = useAuth();
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
  const [showPopupBlockedAlert, setShowPopupBlockedAlert] = useState(false);

  const barData = stats?.porUnidade
    ? Object.entries(stats.porUnidade).map(([unidade, total]) => ({ unidade, total }))
    : [];

  const totalDenuncias = barData.reduce((acc, curr) => acc + curr.total, 0);
  const pieData = totalDenuncias > 0
    ? barData.map((item, idx) => ({
        unidade: item.unidade,
        percentual: parseFloat(((item.total / totalDenuncias) * 100).toFixed(1)),
        cor: CORES_AZUIS[idx % CORES_AZUIS.length]
      }))
    : [];

  const tiposData = stats?.distribuicao?.tipos
    ? stats.distribuicao.tipos.map((item, idx) => ({
        name: item.name === 'ANONIMA' ? 'Anônima' : 'Identificada',
        value: item.value,
        cor: idx === 0 ? '#1B1464' : '#3B82F6',
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
    const taxaIdentificadas = totalDenuncias > 0 ? ((identificadas / totalDenuncias) * 100).toFixed(1) : '0.0';

    const fila = statusData.find(s => s.name === 'Aguardando Análise')?.value || 0;
    const emAndamento = statusData.find(s => s.name === 'Em Andamento')?.value || 0;
    const resolvidos = statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0;
    const arquivados = statusData.find(s => s.name === 'Arquivada')?.value || 0;
    const emAtendimentoTotal = fila + emAndamento;

    let filtroUnidadeText = 'Todas as unidades (19 Unidades)';
    if (filtros.unidade) {
      filtroUnidadeText = filtros.unidade;
    } else if (tags.length > 0) {
      filtroUnidadeText = tags.join(', ');
    }

    const filtroTipoText =
      filtros.tipo === 'anonima'
        ? 'Apenas Anônimas'
        : filtros.tipo === 'identificada'
        ? 'Apenas Identificadas'
        : 'Todos os tipos (Anônimas e Identificadas)';

    const filtroPeriodoText =
      filtros.dataInicio || filtros.dataFim
        ? `${filtros.dataInicio ? `De ${filtros.dataInicio}` : 'Desde o início'} ${filtros.dataFim ? `até ${filtros.dataFim}` : ''}`.trim()
        : 'Todo o histórico de registros';

    const emissorNome = user?.nome || user?.email || 'Painel Administrativo SOBEI';
    const logoUrl = window.location.origin + '/images/LOGO AZUL.png';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setShowPopupBlockedAlert(true);
      return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatDenunciaData = (dataStr) => {
      if (!dataStr) return '—';
      const d = parseDate(dataStr);
      if (!d) return dataStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const denunciasFiltradas = todasDenuncias || [];

    const getStatusBadge = (st) => {
      const s = (st || '').toLowerCase();
      if (s === 'fechada' || s === 'concluido' || s === 'concluida') {
        return `<span style="background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Fechada</span>`;
      }
      if (s === 'em_andamento') {
        return `<span style="background-color: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Em Resolução</span>`;
      }
      if (s === 'arquivada') {
        return `<span style="background-color: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Arquivada</span>`;
      }
      return `<span style="background-color: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Aguardando Análise</span>`;
    };

    const getPriorityBadge = (pr) => {
      const p = (pr || 'NEUTRA').toUpperCase();
      if (p === 'ALTA' || p === 'URGENTE') {
        return `<span style="color: #DC2626; font-weight: 700; font-size: 11px;">● Alta</span>`;
      }
      if (p === 'MEDIA') {
        return `<span style="color: #D97706; font-weight: 700; font-size: 11px;">● Média</span>`;
      }
      if (p === 'BAIXA') {
        return `<span style="color: #16A34A; font-weight: 700; font-size: 11px;">● Baixa</span>`;
      }
      return `<span style="color: #64748B; font-weight: 700; font-size: 11px;">● Neutra</span>`;
    };

    const maxEvolucao = Math.max(...evolucaoData.map((e) => e.total), 1);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Estatístico de Compliance — SOBEI</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap');

          @page {
            size: A4 portrait;
            margin: 12mm 14mm 14mm 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0F172A;
            background-color: #FFFFFF;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Barra Superior no Visualizador Web */
          .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0F172A;
            color: #FFFFFF;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .toolbar-title {
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .btn-print {
            background-color: #2563EB;
            color: #FFFFFF;
            border: none;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: background 0.15s ease;
          }

          .btn-print:hover {
            background-color: #1D4ED8;
          }

          /* Cabeçalho Institucional */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1B1464;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }

          .report-logo-area {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .report-logo {
            height: 48px;
            width: auto;
            object-fit: contain;
          }

          .report-title-block h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: #1B1464;
            margin: 0;
            letter-spacing: -0.02em;
          }

          .report-title-block p {
            font-size: 12px;
            color: #64748B;
            margin: 2px 0 0 0;
            font-weight: 500;
          }

          .report-meta-box {
            text-align: right;
            font-size: 11px;
            color: #475569;
            background: #F8FAFC;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
          }

          .report-meta-box strong {
            color: #1E293B;
          }

          /* Seção de Parâmetros e Filtros */
          .params-card {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }

          .params-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: #1B1464;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }

          .params-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .param-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .param-label {
            font-size: 10px;
            color: #64748B;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .param-value {
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
            white-space: normal;
            word-break: break-word;
          }

          /* Títulos de Seção */
          .section-heading {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            font-weight: 800;
            color: #1B1464;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin: 22px 0 10px 0;
            padding-left: 8px;
            border-left: 3.5px solid #1B1464;
            page-break-after: avoid;
          }

          /* KPIs Executivos */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .kpi-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 12px 14px;
            border-top: 3px solid #1B1464;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .kpi-card--accent {
            border-top-color: #2563EB;
          }

          .kpi-card--orange {
            border-top-color: #D97706;
          }

          .kpi-card--green {
            border-top-color: #16A34A;
          }

          .kpi-label {
            font-size: 10px;
            color: #64748B;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 4px;
          }

          .kpi-number {
            font-family: 'Montserrat', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.1;
          }

          .kpi-sub {
            font-size: 10.5px;
            color: #64748B;
            margin-top: 4px;
            font-weight: 500;
          }

          /* Destaques de Incidência */
          .highlights-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .highlight-card {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .highlight-card__info {
            display: flex;
            flex-direction: column;
          }

          .highlight-card__label {
            font-size: 10px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .highlight-card__name {
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
            margin-top: 2px;
          }

          .highlight-card__badge {
            background-color: #1B1464;
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
          }

          /* Grid de Duas Colunas para Tabelas */
          .two-col-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          /* Tabelas Executivas */
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }

          table.report-table th {
            background-color: #F1F5F9;
            color: #334155;
            font-family: 'Montserrat', sans-serif;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #CBD5E1;
          }

          table.report-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #E2E8F0;
            color: #1E293B;
            vertical-align: middle;
          }

          table.report-table tr:nth-child(even) td {
            background-color: #F8FAFC;
          }

          table.report-table tr:last-child td {
            border-bottom: none;
          }

          /* Barra Gráfica Visual nas Tabelas */
          .progress-bar-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
          }

          .progress-track {
            flex: 1;
            height: 7px;
            background-color: #E2E8F0;
            border-radius: 9999px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 9999px;
          }

          .progress-fill--navy { background-color: #1B1464; }
          .progress-fill--blue { background-color: #2563EB; }
          .progress-fill--red { background-color: #DC2626; }
          .progress-fill--orange { background-color: #D97706; }
          .progress-fill--green { background-color: #16A34A; }
          .progress-fill--gray { background-color: #64748B; }

          .progress-text {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            min-width: 38px;
            text-align: right;
          }

          /* Rodapé do Relatório */
          .report-footer {
            margin-top: 32px;
            padding-top: 14px;
            border-top: 1.5px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #64748B;
            page-break-inside: avoid;
          }

          .report-footer strong {
            color: #1E293B;
          }

          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .report-header {
              margin-top: 0;
            }
          }
        </style>
      </head>
      <body>
        <!-- Botão de Impressão -->
        <div class="toolbar no-print">
          <div class="toolbar-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Relatório Estatístico Executivo de Compliance
          </div>
          <button class="btn-print" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir / Salvar como PDF
          </button>
        </div>

        <!-- Cabeçalho Institucional SOBEI -->
        <div class="report-header">
          <div class="report-logo-area">
            <img class="report-logo" src="${logoUrl}" alt="SOBEI" onerror="this.style.display='none'" />
            <div class="report-title-block">
              <h1>SOBEI — Canal de Denúncias</h1>
              <p>Relatório Executivo e Estatístico de Compliance & Ouvidoria</p>
            </div>
          </div>
          <div class="report-meta-box">
            <div><strong>Emissão:</strong> ${dataEmissao}</div>
            <div><strong>Emissor:</strong> ${emissorNome}</div>
            <div><strong>Ambiente:</strong> Painel Administrativo Oficial</div>
          </div>
        </div>

        <!-- Resumo dos Filtros e Parâmetros Aplicados -->
        <div class="params-card">
          <div class="params-title">Parâmetros de Análise do Relatório</div>
          <div class="params-grid">
            <div class="param-item">
              <span class="param-label">Unidade(s)</span>
              <span class="param-value">${filtroUnidadeText}</span>
            </div>
            <div class="param-item">
              <span class="param-label">Tipo de Manifestação</span>
              <span class="param-value">${filtroTipoText}</span>
            </div>
            <div class="param-item">
              <span class="param-label">Período Selecionado</span>
              <span class="param-value">${filtroPeriodoText}</span>
            </div>
            <div class="param-item">
              <span class="param-label">Volume Filtrado</span>
              <span class="param-value">${totalDenuncias} manifestação(ões)</span>
            </div>
          </div>
        </div>

        <!-- Indicadores Globais de Desempenho (KPIs) -->
        <div class="section-heading">Indicadores Globais de Desempenho</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total de Manifestações</div>
            <div class="kpi-number">${totalDenuncias}</div>
            <div class="kpi-sub">Registros no período filtrado</div>
          </div>
          <div class="kpi-card kpi-card--accent">
            <div class="kpi-label">Taxa de Anonimato</div>
            <div class="kpi-number">${taxaAnonimato}%</div>
            <div class="kpi-sub">${anonimas} anônimas • ${identificadas} identificadas</div>
          </div>
          <div class="kpi-card kpi-card--orange">
            <div class="kpi-label">Casos em Atendimento</div>
            <div class="kpi-number">${emAtendimentoTotal}</div>
            <div class="kpi-sub">${fila} em triagem • ${emAndamento} em resolução</div>
          </div>
          <div class="kpi-card kpi-card--green">
            <div class="kpi-label">Resolutividade Operacional</div>
            <div class="kpi-number">${taxaResolutividade}%</div>
            <div class="kpi-sub">${resolvidos} resolvidos • ${arquivados} arquivados</div>
          </div>
        </div>

        <!-- Destaques de Incidência -->
        <div class="highlights-box">
          <div class="highlight-card">
            <div class="highlight-card__info">
              <span class="highlight-card__label">Unidade com Maior Incidência</span>
              <span class="highlight-card__name">${maxUnidade ? maxUnidade.unidade : 'Nenhuma unidade registrada'}</span>
            </div>
            <span class="highlight-card__badge">${maxUnidade ? `${maxUnidade.total} caso(s)` : '0'}</span>
          </div>
          <div class="highlight-card">
            <div class="highlight-card__info">
              <span class="highlight-card__label">Unidade com Menor Incidência</span>
              <span class="highlight-card__name">${minUnidade ? minUnidade.unidade : 'Nenhuma unidade registrada'}</span>
            </div>
            <span class="highlight-card__badge" style="background-color: #2563EB;">${minUnidade ? `${minUnidade.total} caso(s)` : '0'}</span>
          </div>
        </div>

        <!-- Tabelas de Distribuição Lado a Lado -->
        <div class="two-col-grid">
          <!-- Distribuição por Tipo -->
          <div>
            <div class="section-heading" style="margin-top:0;">Distribuição por Tipo</div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th style="width: 50px; text-align: center;">Qtd</th>
                  <th>Proporção</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Anônima</strong></td>
                  <td style="text-align: center;">${anonimas}</td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div class="progress-track">
                        <div class="progress-fill progress-fill--navy" style="width: ${taxaAnonimato}%;"></div>
                      </div>
                      <span class="progress-text">${taxaAnonimato}%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><strong>Identificada</strong></td>
                  <td style="text-align: center;">${identificadas}</td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div class="progress-track">
                        <div class="progress-fill progress-fill--blue" style="width: ${taxaIdentificadas}%;"></div>
                      </div>
                      <span class="progress-text">${taxaIdentificadas}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Distribuição por Prioridade -->
          <div>
            <div class="section-heading" style="margin-top:0;">Distribuição por Prioridade</div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Prioridade</th>
                  <th style="width: 50px; text-align: center;">Qtd</th>
                  <th>Proporção</th>
                </tr>
              </thead>
              <tbody>
                ${prioridadesData.map(p => {
                  const pct = totalDenuncias > 0 ? ((p.value / totalDenuncias) * 100).toFixed(1) : '0.0';
                  const fillClass = p.name === 'Alta' ? 'progress-fill--red' : p.name === 'Média' ? 'progress-fill--orange' : p.name === 'Baixa' ? 'progress-fill--green' : 'progress-fill--gray';
                  return `
                    <tr>
                      <td>${getPriorityBadge(p.name)}</td>
                      <td style="text-align: center;">${p.value}</td>
                      <td>
                        <div class="progress-bar-wrap">
                          <div class="progress-track">
                            <div class="progress-fill ${fillClass}" style="width: ${pct}%;"></div>
                          </div>
                          <span class="progress-text">${pct}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ciclo de Atendimento / Status -->
        <div class="section-heading">Ciclo de Atendimento e Status dos Casos</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Status do Processo</th>
              <th style="width: 70px; text-align: center;">Quantidade</th>
              <th style="width: 80px; text-align: center;">Percentual</th>
              <th>Representatividade Visual</th>
            </tr>
          </thead>
          <tbody>
            ${statusData.map(s => {
              const pct = totalDenuncias > 0 ? ((s.value / totalDenuncias) * 100).toFixed(1) : '0.0';
              return `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td style="text-align: center; font-weight: 700;">${s.value}</td>
                  <td style="text-align: center; color: #475569;">${pct}%</td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div class="progress-track">
                        <div class="progress-fill progress-fill--navy" style="width: ${pct}%;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Detalhamento Completo por Unidade -->
        <div class="section-heading">Incidência por Unidade Escolar / Setor</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">Rank</th>
              <th>Unidade Escolar / Setor</th>
              <th style="width: 70px; text-align: center;">Total</th>
              <th style="width: 80px; text-align: center;">Participação</th>
              <th style="width: 160px;">Proporção Gráfica</th>
            </tr>
          </thead>
          <tbody>
            ${sortedBarData.map((item, index) => {
              const part = totalDenuncias > 0 ? ((item.total / totalDenuncias) * 100).toFixed(1) : '0.0';
              return `
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #1B1464;">${index + 1}º</td>
                  <td><strong>${item.unidade}</strong></td>
                  <td style="text-align: center; font-weight: 700;">${item.total}</td>
                  <td style="text-align: center; color: #475569;">${part}%</td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div class="progress-track">
                        <div class="progress-fill progress-fill--navy" style="width: ${part}%;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            ${sortedBarData.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 16px; color: #64748B;">Nenhum registro encontrado para os filtros selecionados.</td></tr>` : ''}
          </tbody>
        </table>

        <!-- Histórico de Evolução Temporal -->
        ${evolucaoData.length > 0 ? `
          <div class="section-heading">Histórico de Evolução Temporal</div>
          <table class="report-table" style="max-width: 550px;">
            <thead>
              <tr>
                <th style="width: 120px;">Período</th>
                <th style="width: 80px; text-align: center;">Manifestações</th>
                <th>Volume Gráfico</th>
              </tr>
            </thead>
            <tbody>
              ${evolucaoData.map(item => {
                const barWidth = ((item.total / maxEvolucao) * 100).toFixed(1);
                return `
                  <tr>
                    <td><strong>${item.data}</strong></td>
                    <td style="text-align: center; font-weight: 700;">${item.total}</td>
                    <td>
                      <div class="progress-bar-wrap">
                        <div class="progress-track">
                          <div class="progress-fill progress-fill--blue" style="width: ${barWidth}%;"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Relação das Manifestações Filtradas -->
        ${denunciasFiltradas.length > 0 ? `
          <div class="section-heading">Relação Sintética de Manifestações Filtradas (${denunciasFiltradas.length})</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 110px;">Protocolo</th>
                <th style="width: 85px;">Data</th>
                <th>Unidade</th>
                <th style="width: 90px;">Tipo</th>
                <th style="width: 75px;">Prioridade</th>
                <th style="width: 125px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${denunciasFiltradas.map(d => `
                <tr>
                  <td><strong style="color: #1B1464; font-family: monospace; font-size: 11px;">${d.protocolo || '—'}</strong></td>
                  <td style="color: #475569; font-size: 11px;">${formatDenunciaData(d.dataEnvio || d.dataAbertura)}</td>
                  <td><strong>${d.unidade || '—'}</strong></td>
                  <td style="font-size: 11px;">${d.tipo === 'ANONIMA' || d.tipo === 'anonima' ? 'Anônima' : 'Identificada'}</td>
                  <td>${getPriorityBadge(d.prioridade)}</td>
                  <td>${getStatusBadge(d.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Rodapé Oficial de Compliance -->
        <div class="report-footer">
          <div>
            <strong>SOBEI — Sociedade Beneficente Equilíbrio de Infância</strong><br>
            Relatório de Gestão e Compliance emitido confidencialmente para controle interno.
          </div>
          <div style="text-align: right;">
            Página 1 • ${dataEmissao}
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

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
      <div className="statistics-filters" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '6px 0', marginBottom: 'var(--spacing-lg)' }}>
        <div className="statistics-filters__group" style={{ flex: '0 0 auto', width: '155px' }}>
          <span className="statistics-filters__label">Tipo de denúncia:</span>
          <CustomSelect
            style={{ width: '100%' }}
            value={filtros.tipo}
            onChange={(val) => setFiltros({ ...filtros, tipo: val })}
            defaultOption="Todos os tipos"
            options={[
              { value: 'anonima', label: 'Denúncia anônima' },
              { value: 'identificada', label: 'Denúncia identificada' }
            ]}
          />
        </div>

        <div className="statistics-filters__group" style={{ flex: '0 0 auto', width: '185px' }}>
          <span className="statistics-filters__label">Em qual unidade ocorreu?</span>
          <CustomSelect
            style={{ width: '100%' }}
            value={filtros.unidade}
            onChange={(val) => setFiltros({ ...filtros, unidade: val })}
            defaultOption="Todas as unidades"
            options={UNIDADES.map(u => ({ value: u, label: u }))}
          />
        </div>

        <div className="statistics-filters__group" style={{ flex: '0 0 auto', width: '145px' }}>
          <span className="statistics-filters__label">Período de:</span>
          <CustomDatePicker
            style={{ width: '100%' }}
            value={filtros.dataInicio}
            onChange={(val) => setFiltros({ ...filtros, dataInicio: val })}
            placeholder="Data inicial"
          />
        </div>

        <div className="statistics-filters__group" style={{ flex: '0 0 auto', width: '145px' }}>
          <span className="statistics-filters__label">Até:</span>
          <CustomDatePicker
            style={{ width: '100%' }}
            value={filtros.dataFim}
            onChange={(val) => setFiltros({ ...filtros, dataFim: val })}
            placeholder="Data final"
          />
        </div>

        <div className="statistics-filters__actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignSelf: 'flex-end', minHeight: '38px' }}>
          <button className="btn btn--limpar" onClick={handleLimpar} type="button" style={{ minHeight: '38px', height: '38px', padding: '0 18px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
            Limpar
          </button>
          <button className="btn btn--aplicar" onClick={handleAplicar} type="button" style={{ minHeight: '38px', height: '38px', padding: '0 18px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
            Aplicar
          </button>
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

      {/* KPI Metrics em Card Único Horizontal */}
      {!isLoading && (
        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px 16px',
          marginBottom: 'var(--spacing-md, 16px)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Taxa de Anonimato:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
              {totalDenuncias > 0
                ? `${((tiposData.find(t => t.name === 'Anônima')?.value || 0) / totalDenuncias * 100).toFixed(1)}%`
                : '0.0%'
              }
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total de Manifestações:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>{totalDenuncias}</span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Casos em Resolução:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
              {statusData.find(s => s.name === 'Em Andamento')?.value || 0}
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Casos Resolvidos:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
              {statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0}
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Resolutividade:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>{taxaResolutividade}%</span>
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
                    activeBar={{ fill: '#1B1464', stroke: 'none', outline: 'none' }}
                    style={{ outline: 'none' }}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_AZUIS[index % CORES_AZUIS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--color-gray-500)' }}>Carregando gráficos...</p>
      )}

      {/* Segunda Linha de Gráficos (Bento Grid) */}
      {!isLoading && (
        <div className="statistics-bento" style={{ marginTop: 'var(--spacing-xl)' }}>
          {/* Coluna 1: Evolução no Tempo (Heatmap Estilo GitHub) */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title">Evolução de Denúncias no Tempo:</h2>
            <div className="statistics-chart__wrapper" style={{ minHeight: 'auto', padding: 'var(--spacing-xs) 0' }}>
              <DenunciasHeatmap
                denuncias={todasDenuncias || []}
                dataInicio={filtros.dataInicio}
                dataFim={filtros.dataFim}
              />
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
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showPopupBlockedAlert}
        type="warning"
        title="Pop-ups Bloqueados"
        message="Por favor, permita pop-ups no seu navegador para exportar e visualizar o relatório executivo."
        confirmText="Entendido"
        cancelText={null}
        onClose={() => setShowPopupBlockedAlert(false)}
      />
    </div>
  );
}
