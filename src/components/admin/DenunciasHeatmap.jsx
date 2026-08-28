'use client';

import { useState, useMemo, useRef } from 'react';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export default function DenunciasHeatmap({ denuncias = [], dataInicio, dataFim }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  // Computar mapa de contagem diária e 26 semanas (6 meses) do calendário
  const { weeks, monthLabels, totalCount } = useMemo(() => {
    const counts = {};
    let total = 0;

    denuncias.forEach((d) => {
      const dt = parseDate(d.dataEnvio || d.dataAbertura || d.dataCriacao);
      if (dt) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
    });

    const parsedEnd = dataFim ? parseDate(dataFim) : null;
    const end = parsedEnd || new Date();
    end.setHours(23, 59, 59, 999);

    const parsedStart = dataInicio ? parseDate(dataInicio) : null;
    let start;
    if (parsedStart) {
      start = new Date(parsedStart);
    } else {
      // Fixo em 26 semanas (~6 meses)
      const numWeeks = 26;
      start = new Date(end);
      start.setDate(start.getDate() - (numWeeks * 7 - 1));
    }
    // Alinhar ao Domingo anterior
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const weeksList = [];
    let currentWeek = [];
    const months = [];
    let lastMonth = -1;

    let curr = new Date(start);
    let colIndex = 0;

    while (curr <= end || currentWeek.length > 0) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const count = counts[key] || 0;

      // Detectar novo mês na primeira linha da semana (com distância mínima de 2 colunas)
      if (curr.getMonth() !== lastMonth && currentWeek.length === 0) {
        if (months.length === 0 || colIndex - months[months.length - 1].colIndex >= 2) {
          months.push({
            label: MESES[curr.getMonth()],
            colIndex,
          });
          lastMonth = curr.getMonth();
        }
      }

      currentWeek.push({
        date: new Date(curr),
        dateStr: key,
        dayOfWeek: curr.getDay(),
        dayOfMonth: curr.getDate(),
        month: curr.getMonth(),
        year: curr.getFullYear(),
        count,
        isFuture: curr > new Date(),
      });

      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
        colIndex++;
      }

      curr.setDate(curr.getDate() + 1);
      if (curr > end && currentWeek.length === 0) break;
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksList.push(currentWeek);
    }

    return {
      weeks: weeksList,
      monthLabels: months,
      totalCount: total,
    };
  }, [denuncias, dataInicio, dataFim]);

  const handleMouseEnter = (e, day) => {
    if (!day) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 600 };
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top - 8;
    const containerWidth = containerRect.width || 600;

    let translateX = '-50%';
    let arrowPercent = '50%';

    // Ajusta ancoragem da tooltip para nunca passar das bordas do card
    if (x < 110) {
      translateX = '-10%';
      arrowPercent = '15%';
    } else if (x > containerWidth - 110) {
      translateX = '-90%';
      arrowPercent = '88%';
    }

    setTooltip({
      x,
      y,
      translateX,
      arrowPercent,
      day,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const getCellColor = (count, isFuture) => {
    if (isFuture) return '#f8fafc';
    if (!count || count === 0) return '#f1f5f9';
    if (count === 1) return '#93c5fd';
    if (count === 2) return '#3b82f6';
    if (count <= 4) return '#1d4ed8';
    return '#1b1464';
  };

  const formatTooltipText = (day) => {
    if (!day) return '';
    const { count, dayOfMonth, month, year } = day;
    const nomeMes = MESES_COMPLETOS[month];
    if (count === 0) {
      return `Nenhuma manifestação em ${dayOfMonth} de ${nomeMes} de ${year}`;
    }
    const plural = count === 1 ? 'manifestação' : 'manifestações';
    return `${count} ${plural} em ${dayOfMonth} de ${nomeMes} de ${year}`;
  };

  const gapSize = '4px';
  const cellRadius = '4px';

  return (
    <div className="github-heatmap-container" ref={containerRef} style={{ position: 'relative', width: '100%', padding: '4px 0' }}>
      {/* Grid Principal Responsivo que preenche 100% da largura do card */}
      <div style={{
        width: '100%',
        overflow: 'visible',
        paddingBottom: '4px',
      }}>
        <div style={{ width: '100%' }}>
          {/* Linha dos Meses */}
          <div style={{
            display: 'flex',
            marginLeft: '32px',
            width: 'calc(100% - 32px)',
            height: '20px',
            position: 'relative',
            marginBottom: '4px'
          }}>
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${(m.colIndex / weeks.length) * 100}%`,
                  fontSize: '11px',
                  color: 'var(--color-gray-500)',
                  fontWeight: '600',
                  userSelect: 'none',
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Matriz: Dias da Semana + Colunas Flexíveis */}
          <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
            {/* Coluna com rótulos dos dias (Seg, Qua, Sex) perfeitamente alinhados */}
            <div style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: gapSize,
              width: '24px',
              fontSize: '10px',
              color: 'var(--color-gray-500)',
              fontWeight: '500',
              userSelect: 'none',
              textAlign: 'right',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Seg</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Qua</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Sex</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></span>
            </div>

            {/* Grade de Semanas com largura 100% distribuída uniformemente */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
              gap: gapSize,
              flex: 1,
              width: '100%',
            }}>
              {weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  style={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(7, 1fr)',
                    gap: gapSize,
                    width: '100%',
                  }}
                >
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={dIdx}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            backgroundColor: 'transparent',
                          }}
                        />
                      );
                    }

                    const bg = getCellColor(day.count, day.isFuture);
                    return (
                      <div
                        key={dIdx}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: cellRadius,
                          backgroundColor: bg,
                          border: day.count === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                          cursor: 'pointer',
                          transition: 'filter 0.12s ease',
                        }}
                        className="heatmap-cell"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Heatmap: Total à esquerda e Legenda à direita */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--spacing-md)',
        paddingTop: 'var(--spacing-xs)',
        fontSize: '11px',
        color: 'var(--color-gray-500)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)'
      }}>
        <span>
          <strong>{totalCount}</strong> {totalCount === 1 ? 'manifestação registrada' : 'manifestações registradas'} nos últimos 6 meses
        </span>

        {/* Legenda Estilo GitHub */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <span>Menos</span>
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#f1f5f9', border: '1px solid rgba(0,0,0,0.06)' }} title="0" />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#93c5fd' }} title="1" />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#3b82f6' }} title="2" />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#1d4ed8' }} title="3-4" />
          <div style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#1b1464' }} title="5+" />
          <span>Mais</span>
        </div>
      </div>

      {/* Tooltip Flutuante com posicionamento inteligente */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          transform: `translate(${tooltip.translateX}, -100%)`,
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {formatTooltipText(tooltip.day)}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: tooltip.arrowPercent,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #1E293B',
          }} />
        </div>
      )}
    </div>
  );
}
