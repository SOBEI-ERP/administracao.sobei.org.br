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
      <h1 className="statistics-page__title">Estatísticas</h1>

      {/* Bar Chart */}
      <div className="statistics-page__chart-container">
        <h2 className="statistics-page__chart-title">Relação de denúncias por unidade:</h2>
        {isLoading ? (
          <p style={{ color: 'var(--color-gray-500)' }}>Carregando...</p>
        ) : (
          <div className="statistics-chart__wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
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
                  fill="#2A1F8A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                  activeBar={{ fill: '#2A1F8A', stroke: 'none', outline: 'none' }}
                  style={{ outline: 'none' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="statistics-filters">
        <div className="statistics-filters__group">
          <span className="statistics-filters__label">Tipo de denuncia:</span>
          <CustomSelect
            style={{ minWidth: '220px' }}
            value={filtros.tipo}
            onChange={(val) => setFiltros({ ...filtros, tipo: val })}
            defaultOption="Selecione o tipo de denúncia"
            options={[
              { value: 'anonima', label: 'Denúncia anônima' },
              { value: 'identificada', label: 'Denúncia identificada' }
            ]}
          />
        </div>

        <div className="statistics-filters__group">
          <span className="statistics-filters__label">Em quais unidades ocorreu?</span>
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

      {/* Gráficos Secundários */}
      {!isLoading && (
        <div className="statistics-secondary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
          
          {/* Pie Chart de Tipos */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title" style={{ padding: '0 var(--spacing-md)' }}>Distribuição por tipo de denúncia:</h2>
            <div className="statistics-chart__wrapper" style={{ padding: '10px 0' }}>
              {tiposData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tiposData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '40px 0' }}>Sem dados para exibir</p>
              )}
            </div>
          </div>

          {/* Cards de Status */}
          <div className="statistics-page__chart-container" style={{ margin: 0 }}>
            <h2 className="statistics-page__chart-title" style={{ padding: '0 var(--spacing-md)' }}>Distribuição por status das denúncias:</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '24px' }}>
              {statusData.length > 0 ? (
                statusData.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(124, 107, 196, 0.05)',
                      border: '1px solid rgba(124, 107, 196, 0.15)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#2A1F8A' }}>
                      {item.value}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-gray-600)', marginTop: '4px' }}>
                      {item.name}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '40px 0' }}>Sem dados para exibir</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Generate Report */}
      <div className="statistics-report">
        <button className="btn btn--secondary btn--lg" type="button" id="btn-gerar-relatorio">
          Gerar relatório
        </button>
      </div>
    </div>
  );
}
