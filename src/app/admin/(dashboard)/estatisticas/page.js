'use client';

import { useState } from 'react';
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
  const [filtros, setFiltros] = useState({
    tipo: '',
    unidade: '',
    dataInicio: '',
    dataFim: '',
  });
  const [tags, setTags] = useState([]);

  const { data: stats, isLoading } = useEstatisticas(filtros);

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

  const barData = stats?.porUnidade || [];
  const pieData = stats?.distribuicao || [];

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

      {/* Pie Chart */}
      {!isLoading && (
        <div className="statistics-chart__wrapper" style={{ marginTop: '24px' }}>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="percentual"
                nameKey="unidade"
                cx="50%"
                cy="50%"
                outerRadius={160}
                innerRadius={0}
                label={({ unidade, percentual }) => `${percentual}%`}
                labelLine={true}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.cor || CORES_PIE[index % CORES_PIE.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="left"
                formatter={(value, entry) => {
                  const item = pieData.find((d) => d.unidade === value);
                  return `${value} ${item ? item.percentual + '%' : ''}`;
                }}
                wrapperStyle={{ fontSize: '14px', lineHeight: '28px' }}
              />
            </PieChart>
          </ResponsiveContainer>
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
