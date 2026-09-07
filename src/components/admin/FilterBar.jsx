'use client';

import { UNIDADES } from '@/lib/mockData';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

export default function FilterBar({ filtros, setFiltros, onAplicar, onLimpar, status }) {
  return (
    <div className="filter-bar" style={{ display: 'flex', width: '100%', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '6px 0', marginBottom: 'var(--spacing-md)' }}>
      {/* Buscar por Protocolo */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '155px' }}>
        <span className="filter-bar__label">Buscar por protocolo:</span>
        <input
          type="text"
          className="form-input filter-bar__input"
          style={{
            minHeight: '38px',
            height: '38px',
            width: '100%',
            padding: '0 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-white)',
            fontSize: '13px',
            boxSizing: 'border-box'
          }}
          placeholder="Ex: AAA-000-000"
          value={filtros.protocolo || ''}
          maxLength={11}
          onChange={(e) => {
            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            let formatted = '';

            for (let i = 0; i < val.length && i < 9; i++) {
              let char = val[i];
              if (i < 3) {
                if (/[A-Z]/.test(char)) {
                  formatted += char;
                } else {
                  break;
                }
              } else {
                if (/[0-9]/.test(char)) {
                  if (i === 3 || i === 6) {
                    formatted += '-';
                  }
                  formatted += char;
                } else {
                  break;
                }
              }
            }
            setFiltros({ ...filtros, protocolo: formatted });
          }}
        />
      </div>

      {/* Período De */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '145px' }}>
        <span className="filter-bar__label">Período de:</span>
        <CustomDatePicker
          value={filtros.dataInicio}
          onChange={(val) => setFiltros({ ...filtros, dataInicio: val })}
          placeholder="Data inicial"
          style={{ width: '100%' }}
        />
      </div>

      {/* Período Até */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '145px' }}>
        <span className="filter-bar__label">Até:</span>
        <CustomDatePicker
          value={filtros.dataFim}
          onChange={(val) => setFiltros({ ...filtros, dataFim: val })}
          placeholder="Data final"
          style={{ width: '100%' }}
        />
      </div>

      {/* Tipo de denúncia */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '155px' }}>
        <span className="filter-bar__label">Tipo de denúncia:</span>
        <CustomSelect
          style={{ width: '100%' }}
          value={filtros.tipo}
          onChange={(val) => setFiltros({ ...filtros, tipo: val })}
          defaultOption="Todos os tipos"
          allowEmpty={true}
          options={[
            { value: 'anonima', label: 'Denúncia anônima' },
            { value: 'identificada', label: 'Denúncia identificada' }
          ]}
        />
      </div>

      {/* Unidade */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '185px' }}>
        <span className="filter-bar__label">Em qual unidade ocorreu?</span>
        <CustomSelect
          style={{ width: '100%' }}
          value={filtros.unidade}
          onChange={(val) => setFiltros({ ...filtros, unidade: val })}
          defaultOption="Todas as unidades"
          allowEmpty={true}
          options={UNIDADES.map(u => ({ value: u, label: u }))}
        />
      </div>

      {/* Ordem */}
      <div className="filter-bar__group" style={{ flex: '0 0 auto', width: '145px' }}>
        <span className="filter-bar__label">Ordem:</span>
        <CustomSelect
          style={{ width: '100%' }}
          value={filtros.ordem}
          onChange={(val) => setFiltros({ ...filtros, ordem: val })}
          defaultOption="Selecione a ordem"
          allowEmpty={false}
          options={[
            { value: 'recentes', label: 'Mais recentes' },
            { value: 'antigos', label: 'Mais antigos' }
          ]}
        />
      </div>



      {/* Ações de Filtro */}
      <div className="filter-bar__actions" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginLeft: 'auto', minHeight: '38px' }}>
        <button className="btn btn--limpar" onClick={onLimpar} type="button" style={{ minHeight: '38px', height: '38px', padding: '0 18px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
          Limpar
        </button>
        <button className="btn btn--aplicar" onClick={onAplicar} type="button" style={{ minHeight: '38px', height: '38px', padding: '0 18px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
          Aplicar
        </button>
      </div>
    </div>
  );
}
