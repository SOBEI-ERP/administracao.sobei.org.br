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
import { useEstatisticas } from '@/hooks/useDenuncias';
import { UNIDADES } from '@/lib/mockData';

const CORES_PIE = ['#7C6BC4', '#FF7043', '#43A047', '#FFB74D', '#9C8FD9', '#E53935'];

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

  const { data: stats, isLoading } = useEstatisticas(filtros);

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

  // Custom label for pie chart
  const renderCustomLabel = ({ unidade, percentual, x, y }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#333">
      {`${percentual}%`}
    </text>
  );

  return (
    <div>
      {/* Header Actions */}
      <div className="statistics-header">
        <h1 className="statistics-page__title">Estatísticas</h1>
        <button className="btn btn--secondary" type="button" id="btn-gerar-relatorio">
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
              defaultOption="Selecione o tipo"
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
              defaultOption="Selecione a unidade"
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
          {/* Card 1: Total de Denúncias */}
          <div className="kpi-card">
            <div className="kpi-card__header">
              <span className="kpi-card__title">Total</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <span className="kpi-card__value">{totalDenuncias}</span>
            <span className="kpi-card__desc">Manifestações no período</span>
          </div>

          {/* Card 2: Taxa de Anonimato */}
          <div className="kpi-card kpi-card--accent">
            <div className="kpi-card__header">
              <span className="kpi-card__title">Anonimato</span>
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

          {/* Card 3: Na Fila */}
          <div className="kpi-card kpi-card--orange">
            <div className="kpi-card__header">
              <span className="kpi-card__title">Na Fila</span>
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
              <span className="kpi-card__title">Em Resolução</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Em Andamento')?.value || 0}
            </span>
            <span className="kpi-card__desc">Sendo apurados</span>
          </div>

          {/* Card 5: Fechadas */}
          <div className="kpi-card kpi-card--green">
            <div className="kpi-card__header">
              <span className="kpi-card__title">Fechadas</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Protocolo Fechado')?.value || 0}
            </span>
            <span className="kpi-card__desc">Protocolos finalizados</span>
          </div>

          {/* Card 6: Arquivadas */}
          <div className="kpi-card kpi-card--green">
            <div className="kpi-card__header">
              <span className="kpi-card__title">Arquivadas</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-card__icon"><path d="M21 8v13H3V8"></path><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </div>
            <span className="kpi-card__value">
              {statusData.find(s => s.name === 'Arquivada')?.value || 0}
            </span>
            <span className="kpi-card__desc">Sem evidências</span>
          </div>
        </div>
      )}

      {/* Gráficos - Bento Grid */}
      {!isLoading ? (
        <div className="statistics-bento">
          {/* Coluna 1: Bar Chart */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title">Relação de denúncias por unidade:</h2>
            <div className="statistics-chart__wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2A1F8A" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#1B1464" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="unidade"
                    tick={{ fontSize: 13, fill: '#333' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: '#333' }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: 'Denúncias',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 14, fill: '#333', fontWeight: 600 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                    activeBar={{ fill: '#7C6BC4', stroke: 'none', outline: 'none' }}
                    style={{ outline: 'none' }}
                  />
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
    </div>
  );
}
