'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { fetchEstatisticasCongresso } from '@/lib/api';
import { IconSearch } from '@/components/Icons';
import CustomSelect from '@/components/admin/CustomSelect';

const CORES_DONUT_OSC = ['#0C1B33', '#F97316'];
const CORES_DONUT_OFICINA = ['#10B981', '#F59E0B'];
const CORES_BARRAS_UNIDADES = [
  '#0C1B33', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA',
  '#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#0D9488',
  '#14B8A6', '#2DD4BF', '#059669', '#10B981',
];

function unificarOscs(lista) {
  if (!lista || lista.length === 0) return [];
  const map = new Map();
  for (const item of lista) {
    const raw = (item.nomeOsc || 'Outras Instituições').trim();
    const semAcento = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const partes = semAcento.split(/\s+[-/|:]\s+/);
    const chave = (partes[0] || semAcento).replace(/[^a-z0-9]/g, '') || 'outras';

    if (!map.has(chave)) {
      map.set(chave, { nomeOsc: raw, totalInscritos: 0, percentualOutras: 0 });
    }
    const grp = map.get(chave);
    grp.totalInscritos += (item.totalInscritos || 0);
    grp.percentualOutras += (item.percentualOutras || 0);

    if (raw.length < grp.nomeOsc.length && !raw.includes(' - ')) {
      grp.nomeOsc = raw;
    } else if (raw.match(/\b[A-Z]{2,}\b/) && !grp.nomeOsc.match(/\b[A-Z]{2,}\b/)) {
      grp.nomeOsc = raw;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalInscritos - a.totalInscritos);
}

export default function CongressoEstatisticas() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buscaOficina, setBuscaOficina] = useState('');
  const [filtroStatusOficina, setFiltroStatusOficina] = useState('todas'); // 'todas' | 'esgotadas' | 'quase_cheias' | 'disponiveis'

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEstatisticasCongresso();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas do congresso:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    fetchEstatisticasCongresso()
      .then((data) => {
        if (ativo) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar estatísticas:', err);
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const outrasOscsUnificadas = useMemo(() => {
    return stats?.porOutraOsc ? unificarOscs(stats.porOutraOsc) : [];
  }, [stats]);

  // Exportação do Relatório Oficial do Congresso (Impressão / PDF)
  const handleExportarRelatorioCongresso = useCallback(() => {
    if (!stats) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, autorize pop-ups para exportar o relatório do Congresso.');
      return;
    }

    const dataHoje = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Relatório Executivo — Congresso SOBEI 2026</title>
        <style>
          @page { size: A4; margin: 15mm 12mm 15mm 12mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            line-height: 1.35;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0C1B33;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            color: #0C1B33;
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }
          .header p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748B;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-box {
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 8px 10px;
            background: #F8FAFC;
          }
          .kpi-box strong {
            display: block;
            font-size: 9px;
            text-transform: uppercase;
            color: #64748B;
          }
          .kpi-box .val {
            font-size: 18px;
            font-weight: 800;
            color: #0C1B33;
          }
          .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0C1B33;
            margin: 16px 0 6px 0;
            border-left: 3px solid #2563EB;
            padding-left: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 14px;
          }
          th, td {
            border: 1px solid #E2E8F0;
            padding: 5px 8px;
            text-align: left;
          }
          th {
            background: #0C1B33;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 9.5px;
            text-transform: uppercase;
          }
          tr:nth-child(even) { background: #F8FAFC; }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
          }
          .badge-esgotada { background: #FEE2E2; color: #991B1B; }
          .badge-quase { background: #FEF3C7; color: #92400E; }
          .badge-disp { background: #DCFCE7; color: #166534; }
          .footer {
            margin-top: 24px;
            border-top: 1px solid #CBD5E1;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Congresso SOBEI 2026 — Relatório Analítico</h1>
            <p>Painel de Consolidação Estatística de Inscrições, Oficinas e Presença</p>
          </div>
          <div style="text-align: right;">
            <strong>SOBEI — Gestão Institucional</strong><br>
            <span>Emitido em: ${dataHoje}</span>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-box">
            <strong>Total de Inscritos</strong>
            <div class="val">${stats.totalInscritos} / ${stats.limiteVagas}</div>
            <small>${stats.percentualPreenchimento}% da capacidade</small>
          </div>
          <div class="kpi-box">
            <strong>Origem dos Participantes</strong>
            <div class="val">${stats.totalSobei} SOBEI</div>
            <small>${stats.totalOutrasOsc} de Outras OSCs (${stats.percentualOutrasOsc}%)</small>
          </div>
          <div class="kpi-box">
            <strong>Adesão a Oficinas</strong>
            <div class="val">${stats.totalComOficina} com oficina</div>
            <small>${stats.totalSemOficina} pendentes (${stats.percentualSemOficina}%)</small>
          </div>
          <div class="kpi-box">
            <strong>Check-in Ambos os Dias</strong>
            <div class="val">${stats.presentesAmbosDias}</div>
            <small>Dia 11: ${stats.presentesDia11} • Dia 12: ${stats.presentesDia12}</small>
          </div>
        </div>

        <div class="section-title">1. Ranking de Participação por Unidade Escolar SOBEI</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>Unidade Escolar</th>
              <th style="width: 85px; text-align: center;">Inscritos</th>
              <th style="width: 95px; text-align: center;">Com Oficina</th>
              <th style="width: 95px; text-align: center;">Sem Oficina</th>
              <th style="width: 80px; text-align: center;">Participação</th>
            </tr>
          </thead>
          <tbody>
            ${(stats.porUnidade || []).map((u, i) => `
              <tr>
                <td style="text-align: center; font-weight: 700;">${i + 1}º</td>
                <td><strong>${u.unidade}</strong></td>
                <td style="text-align: center; font-weight: 700;">${u.totalInscritos}</td>
                <td style="text-align: center; color: #166534;">${u.comOficina}</td>
                <td style="text-align: center; color: ${u.semOficina > 0 ? '#DC2626' : '#64748B'}; font-weight: ${u.semOficina > 0 ? '700' : 'normal'};">${u.semOficina}</td>
                <td style="text-align: center;">${u.percentualDoTotal}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">2. Lotação das 23 Oficinas Pedagógicas</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Oficina (Tema & Ministrante)</th>
              <th style="width: 110px;">Eixo Temático</th>
              <th style="width: 70px; text-align: center;">Lotação</th>
              <th style="width: 60px; text-align: center;">SOBEI</th>
              <th style="width: 75px; text-align: center;">Outras OSCs</th>
              <th style="width: 80px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(stats.porOficina || []).map((of, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>
                  <strong>${of.ministrante}</strong><br>
                  <span style="color: #475569; font-size: 9.5px;">${of.tema}</span>
                </td>
                <td>${of.categoria}</td>
                <td style="text-align: center; font-weight: 700;">${of.totalInscritos}/${of.capacidadeSala}</td>
                <td style="text-align: center;">${of.inscritosSobei}</td>
                <td style="text-align: center;">${of.inscritosOutrasOsc}/10</td>
                <td style="text-align: center;">
                  <span class="badge ${of.status === 'ESGOTADA' ? 'badge-esgotada' : (of.status === 'QUASE_CHEIA' ? 'badge-quase' : 'badge-disp')}">
                    ${of.status === 'ESGOTADA' ? 'Esgotada' : (of.status === 'QUASE_CHEIA' ? 'Quase Cheia' : 'Disponível')}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${(outrasOscsUnificadas && outrasOscsUnificadas.length > 0) ? `
          <div class="section-title">3. Participantes de Outras Instituições (Parceiras / Externas)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>Instituição / Entidade</th>
                <th style="width: 90px; text-align: center;">Participantes</th>
                <th style="width: 90px; text-align: center;">Proporção</th>
              </tr>
            </thead>
            <tbody>
              ${outrasOscsUnificadas.map((osc, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${osc.nomeOsc}</strong></td>
                  <td style="text-align: center; font-weight: 700;">${osc.totalInscritos}</td>
                  <td style="text-align: center;">${(osc.percentualOutras || 0).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <div>SOBEI — Sociedade Beneficente Equilíbrio de Interlagos • Relatório de Gestão Interna</div>
          <div>Documento confidencial gerado pelo Painel Suporte</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }, [stats, outrasOscsUnificadas]);

  useEffect(() => {
    const onRecarregar = () => carregarDados();
    const onExportar = () => handleExportarRelatorioCongresso();
    window.addEventListener('recarregar-congresso-stats', onRecarregar);
    window.addEventListener('exportar-relatorio-congresso', onExportar);
    return () => {
      window.removeEventListener('recarregar-congresso-stats', onRecarregar);
      window.removeEventListener('exportar-relatorio-congresso', onExportar);
    };
  }, [carregarDados, handleExportarRelatorioCongresso]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '12px' }}>
        <div className="loading-spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        <span style={{ fontSize: '0.90rem', color: '#64748B', fontWeight: '600' }}>Carregando estatísticas consolidadas do Congresso...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>Não foi possível carregar as estatísticas</div>
        <p style={{ color: '#64748B', fontSize: '0.90rem', marginBottom: '16px' }}>Verifique se o perfil de acesso possui permissão Suporte e tente novamente.</p>
        <button type="button" className="btn btn--secondary" onClick={carregarDados}>Tentar Novamente</button>
      </div>
    );
  }

  // 1. Dados para Gráficos Donut
  const donutOscData = [
    { name: 'SOBEI (Internos)', value: stats.totalSobei, color: CORES_DONUT_OSC[0] },
    { name: 'Outras OSCs (Parceiros)', value: stats.totalOutrasOsc, color: CORES_DONUT_OSC[1] },
  ];

  const donutOficinasData = [
    { name: 'Com Oficina Escolhida', value: stats.totalComOficina, color: CORES_DONUT_OFICINA[0] },
    { name: 'Sem Oficina (Pendente)', value: stats.totalSemOficina, color: CORES_DONUT_OFICINA[1] },
  ];

  // 2. Filtro de Oficinas
  const oficinasFiltradas = (stats.porOficina || []).filter((of) => {
    const termo = buscaOficina.trim().toLowerCase();
    const matchBusca = !termo ||
      of.tema.toLowerCase().includes(termo) ||
      of.ministrante.toLowerCase().includes(termo) ||
      of.categoria.toLowerCase().includes(termo);

    if (!matchBusca) return false;

    if (filtroStatusOficina === 'esgotadas') return of.status === 'ESGOTADA';
    if (filtroStatusOficina === 'quase_cheias') return of.status === 'QUASE_CHEIA';
    if (filtroStatusOficina === 'disponiveis') return of.status === 'DISPONIVEL';

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg, 20px)' }}>
      {/* 1. KPI Metrics em Card Único Horizontal */}
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
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total de Inscritos:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.totalInscritos} / {stats.limiteVagas} ({stats.percentualPreenchimento}%)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>SOBEI:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.totalSobei} ({stats.percentualSobei}%)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Outras OSCs:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.totalOutrasOsc} ({stats.percentualOutrasOsc}%)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Com Oficina:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.totalComOficina} ({stats.percentualComOficina}%)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sem Oficina:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: stats.totalSemOficina > 0 ? '#D97706' : 'var(--color-gray-800)' }}>
            {stats.totalSemOficina} ({stats.percentualSemOficina}%)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Presença Geral:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.presentesGeral}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-gray-200)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Ambos os Dias:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)' }}>
            {stats.presentesAmbosDias}
          </span>
        </div>
      </div>

      {/* 3. Seção de Gráficos: SOBEI vs Outras OSCs & Com vs Sem Oficina */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'var(--spacing-lg, 20px)',
      }}>
        {/* Gráfico A: Proporção SOBEI vs Outras OSCs */}
        <div className="statistics-page__chart-container" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md, 16px)' }}>
              <h3 className="statistics-page__chart-title" style={{ margin: 0 }}>
                SOBEI vs Outras OSCs
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-gray-500)', fontWeight: '600' }}>Participação por Origem</span>
            </div>

            <div style={{ position: 'relative', height: '210px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutOscData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={0}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    dataKey="value"
                  >
                    {donutOscData.map((entry, index) => (
                      <Cell key={`cell-osc-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${val} participantes (${stats.totalInscritos > 0 ? ((val / stats.totalInscritos) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* KPI central dentro do furo da Donut */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#0C1B33', lineHeight: 1 }}>
                  {stats.totalInscritos}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
                  Inscritos
                </div>
              </div>
            </div>

            {/* Legenda inline elegante com valores e proporções */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0C1B33', display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: '600' }}>SOBEI:</span>
                <strong style={{ color: '#0C1B33' }}>{stats.totalSobei} ({stats.percentualSobei}%)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F97316', display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: '600' }}>Outras OSCs:</span>
                <strong style={{ color: '#F97316' }}>{stats.totalOutrasOsc} ({stats.percentualOutrasOsc}%)</strong>
              </div>
            </div>
          </div>

          {/* Tag sutil e compacta das OSCs parceiras unificadas (sem lista pesada) */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {outrasOscsUnificadas && outrasOscsUnificadas.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '600' }}>
                  {outrasOscsUnificadas.length === 1 ? 'Parceira externa:' : 'Parceiras externas:'}
                </span>
                {outrasOscsUnificadas.map((item, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    color: '#C2410C',
                    backgroundColor: '#FFF7ED',
                    border: '1px solid #FFEDD5',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {item.nomeOsc} ({item.totalInscritos})
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Nenhuma OSC parceira registrada</span>
            )}
          </div>
        </div>

        {/* Gráfico B: Inscrição em Oficinas vs Sem Oficinas */}
        <div className="statistics-page__chart-container" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md, 16px)' }}>
              <h3 className="statistics-page__chart-title" style={{ margin: 0 }}>
                Adesão às Oficinas Pedagógicas
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-gray-500)', fontWeight: '600' }}>Definidos vs Pendentes</span>
            </div>

            <div style={{ position: 'relative', height: '210px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutOficinasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={0}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    dataKey="value"
                  >
                    {donutOficinasData.map((entry, index) => (
                      <Cell key={`cell-of-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${val} participantes (${stats.totalInscritos > 0 ? ((val / stats.totalInscritos) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* KPI central dentro do furo da Donut */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#10B981', lineHeight: 1 }}>
                  {stats.percentualComOficina}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
                  Com Oficina
                </div>
              </div>
            </div>

            {/* Legenda inline elegante com valores e proporções */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: '600' }}>Com Oficina:</span>
                <strong style={{ color: '#065F46' }}>{stats.totalComOficina} ({stats.percentualComOficina}%)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: '600' }}>Sem Oficina:</span>
                <strong style={{ color: stats.totalSemOficina > 0 ? '#B45309' : '#64748B' }}>{stats.totalSemOficina} ({stats.percentualSemOficina}%)</strong>
              </div>
            </div>
          </div>

          {/* Tag de status inline e concisa (sem caixas grandes de alerta) */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: '700',
              color: stats.totalSemOficina > 0 ? '#B45309' : '#047857',
              backgroundColor: stats.totalSemOficina > 0 ? '#FEF3C7' : '#ECFDF5',
              border: `1px solid ${stats.totalSemOficina > 0 ? '#FDE68A' : '#A7F3D0'}`,
              padding: '2px 10px',
              borderRadius: '12px',
            }}>
              {stats.totalSemOficina > 0 ? `⚠ ${stats.totalSemOficina} pendentes de escolha` : '✓ 100% das oficinas alocadas'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Gráfico de Crescimento nas Inscrições (Evolução Temporal) */}
      <div className="statistics-page__chart-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md, 16px)', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="statistics-page__chart-title" style={{ margin: 0 }}>
              Curva de Crescimento das Inscrições
            </h3>
            <span style={{ fontSize: '0.80rem', color: 'var(--color-gray-500)' }}>
              Evolução temporal acumulada das inscrições registradas
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', fontWeight: '700' }}>
            <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block' }} />
              Total Acumulado
            </span>
          </div>
        </div>

        <div style={{ height: '270px', width: '100%' }}>
          {stats.evolucaoInscricoes && stats.evolucaoInscricoes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.evolucaoInscricoes} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="corAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#0C1B33', color: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', fontSize: '0.80rem' }}>
                          <div style={{ fontWeight: '800', marginBottom: '4px' }}>Data: {d.data} ({d.dataCompleta})</div>
                          <div>Total Acumulado: <strong>{d.acumulado}</strong></div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>+{d.noDia} no dia (SOBEI: {d.sobeiNoDia} • Outras: {d.outrasOscNoDia})</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="acumulado" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#corAcumulado)" name="Total Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.86rem' }}>
              Sem histórico temporal suficiente para traçar a curva de crescimento.
            </div>
          )}
        </div>
      </div>

      {/* 5. Inscrições por Unidade Escolar SOBEI */}
      <div className="statistics-page__chart-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md, 16px)' }}>
          <div>
            <h3 className="statistics-page__chart-title" style={{ margin: 0 }}>
              Inscrições por Unidade Escolar SOBEI
            </h3>
            <span style={{ fontSize: '0.80rem', color: 'var(--color-gray-500)' }}>
              Distribuição de inscritos nos CEIs, CEDESPs e Unidades Conveniadas da rede
            </span>
          </div>
          <span style={{ fontSize: '0.80rem', fontWeight: '700', color: 'var(--color-primary, #1B1464)' }}>
            Total SOBEI: {stats.totalSobei} inscritos
          </span>
        </div>

        {/* Gráfico de Barras das Unidades */}
        <div style={{ height: '280px', width: '100%', marginBottom: '18px' }}>
          {stats.porUnidade && stats.porUnidade.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.porUnidade} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="unidade"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val} participantes (${item.payload.percentualDoTotal}%)`,
                    'Inscritos',
                  ]}
                />
                <Bar dataKey="totalInscritos" radius={[4, 4, 0, 0]}>
                  {stats.porUnidade.map((entry, index) => (
                    <Cell key={`bar-uni-${index}`} fill={CORES_BARRAS_UNIDADES[index % CORES_BARRAS_UNIDADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
              Nenhuma unidade com participantes registrados.
            </div>
          )}
        </div>

        {/* Tabela Sintética de Ranking por Unidade */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', width: '45px', textAlign: 'center' }}>Pos</th>
                <th style={{ padding: '8px 10px' }}>Unidade Escolar</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Inscritos</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '105px' }}>Com Oficina</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '105px' }}>Sem Oficina</th>
                <th style={{ padding: '8px 10px', width: '160px' }}>Proporção da Rede</th>
              </tr>
            </thead>
            <tbody>
              {(stats.porUnidade || []).map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '800', color: i < 3 ? '#2563EB' : '#64748B' }}>
                    {i + 1}º
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0F172A' }}>
                    {u.unidade}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>
                    {u.totalInscritos}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#166534', fontWeight: '600' }}>
                    {u.comOficina}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: u.semOficina > 0 ? '#DC2626' : '#94A3B8', fontWeight: u.semOficina > 0 ? '800' : 'normal' }}>
                    {u.semOficina}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, u.percentualDoTotal * 3)}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#475569', minWidth: '36px' }}>{u.percentualDoTotal}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Seção Completa: Lotação das 23 Oficinas Pedagógicas */}
      <div className="statistics-page__chart-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: 'var(--spacing-md, 16px)',
        }}>
          <div>
            <h3 className="statistics-page__chart-title" style={{ margin: 0 }}>
              Painel de Ocupação das 23 Oficinas Pedagógicas
            </h3>
            <span style={{ fontSize: '0.80rem', color: 'var(--color-gray-500)' }}>
              Monitoramento de lotação das salas e limites de vagas para SOBEI e Outras OSCs (10 vagas)
            </span>
          </div>

          {/* Filtros Padronizados da Plataforma */}
          <div className="statistics-filters" style={{ margin: 0, padding: 0, gap: '12px', alignItems: 'flex-end' }}>
            <div className="statistics-filters__group" style={{ width: '230px' }}>
              <span className="statistics-filters__label">Buscar na oficina:</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    height: '38px',
                    minHeight: '38px',
                    borderRadius: 'var(--radius-full)',
                    paddingLeft: '34px',
                    fontSize: '13px',
                    border: '1px solid var(--color-gray-300)',
                    backgroundColor: 'var(--color-white)',
                  }}
                  placeholder="Tema ou ministrante..."
                  value={buscaOficina}
                  onChange={(e) => setBuscaOficina(e.target.value)}
                />
                <span style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--color-gray-400)' }}>
                  <IconSearch size={14} />
                </span>
              </div>
            </div>

            <div className="statistics-filters__group" style={{ width: '200px' }}>
              <span className="statistics-filters__label">Status da sala:</span>
              <CustomSelect
                value={filtroStatusOficina}
                onChange={setFiltroStatusOficina}
                defaultOption="Todas as oficinas"
                allowEmpty={false}
                options={[
                  { value: 'todas', label: `Todas (${stats.porOficina?.length || 0})` },
                  { value: 'disponiveis', label: `Com vagas (${stats.porOficina?.filter(o => o.status === 'DISPONIVEL').length || 0})` },
                  { value: 'quase_cheias', label: `Quase cheias (${stats.porOficina?.filter(o => o.status === 'QUASE_CHEIA').length || 0})` },
                  { value: 'esgotadas', label: `Esgotadas (${stats.porOficina?.filter(o => o.status === 'ESGOTADA').length || 0})` },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Tabela de Oficinas */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Ministrante & Tema</th>
                <th style={{ padding: '10px 12px', width: '140px' }}>Eixo Temático</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '100px' }}>Ocupação Sala</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>SOBEI</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Outras OSCs (Máx 10)</th>
                <th style={{ padding: '10px 12px', width: '150px' }}>Lotação</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '95px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {oficinasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
                    Nenhuma oficina encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                oficinasFiltradas.map((of, index) => {
                  const isEsgotada = of.status === 'ESGOTADA';
                  const isQuase = of.status === 'QUASE_CHEIA';
                  const outrasOscEsgotada = of.inscritosOutrasOsc >= 10;

                  return (
                    <tr key={of.id || index} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isEsgotada ? '#FFFBFB' : '#FFFFFF' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.88rem' }}>
                          {of.ministrante}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', lineHeight: '1.3' }}>
                          {of.tema}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontWeight: '600', fontSize: '0.76rem' }}>
                        {of.categoria}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: isEsgotada ? '#DC2626' : '#0F172A' }}>
                        {of.totalInscritos} / {of.capacidadeSala}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1E40AF', fontWeight: '700' }}>
                        {of.inscritosSobei}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: '800',
                          color: outrasOscEsgotada ? '#B91C1C' : '#EA580C',
                          backgroundColor: outrasOscEsgotada ? '#FEE2E2' : '#FFF7ED',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.74rem',
                        }}>
                          {of.inscritosOutrasOsc} / 10
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '7px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, of.percentualOcupacao)}%`,
                              height: '100%',
                              backgroundColor: isEsgotada ? '#EF4444' : (isQuase ? '#F59E0B' : '#10B981'),
                              borderRadius: '4px',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', minWidth: '35px' }}>
                            {of.percentualOcupacao}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.70rem',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: isEsgotada ? '#FEE2E2' : (isQuase ? '#FEF3C7' : '#DCFCE7'),
                          color: isEsgotada ? '#991B1B' : (isQuase ? '#92400E' : '#166534'),
                        }}>
                          {isEsgotada ? 'Esgotada' : (isQuase ? 'Quase Cheia' : 'Disponível')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
