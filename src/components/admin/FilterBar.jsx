'use client';

import { UNIDADES } from '@/lib/mockData';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

export default function FilterBar({ filtros, setFiltros, onAplicar, onLimpar, status }) {
  return (
    <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Primeira linha: Pesquisa por protocolo e Filtros de período */}
      <div className="filter-bar__row" style={{ display: 'flex', width: '100%', gap: 'var(--spacing-xl)', flexWrap: 'wrap', marginBottom: 'var(--spacing-sm)', borderBottom: '1px dashed var(--color-gray-200)', paddingBottom: 'var(--spacing-md)' }}>
        {/* Barra de Pesquisa */}
        <div className="filter-bar__group" style={{ flex: '2', minWidth: '280px' }}>
          <span className="filter-bar__label">Buscar por protocolo:</span>
          <input
            type="text"
            className="form-input"
            style={{ minHeight: '40px', height: '40px', padding: '0 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-gray-300)', backgroundColor: 'var(--color-gray-100)', fontSize: '14px' }}
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

        {/* Filtros de Período */}
        <div className="filter-bar__group" style={{ flex: '1', minWidth: '180px' }}>
          <span className="filter-bar__label">Período de:</span>
          <CustomDatePicker
            value={filtros.dataInicio}
            onChange={(val) => setFiltros({ ...filtros, dataInicio: val })}
            placeholder="Data inicial"
            style={{ width: '100%' }}
          />
        </div>
        <div className="filter-bar__group" style={{ flex: '1', minWidth: '180px' }}>
          <span className="filter-bar__label">Até:</span>
          <CustomDatePicker
            value={filtros.dataFim}
            onChange={(val) => setFiltros({ ...filtros, dataFim: val })}
            placeholder="Data final"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Segunda linha: Filtros em dropdown e botões */}
      <div className="filter-bar__row" style={{ display: 'flex', width: '100%', gap: 'var(--spacing-xl)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Tipo de denúncia */}
        <div className="filter-bar__group" style={{ minWidth: '180px' }}>
          <span className="filter-bar__label">Tipo de denúncia:</span>
          <CustomSelect
            style={{ minWidth: '180px' }}
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
        <div className="filter-bar__group" style={{ minWidth: '200px' }}>
          <span className="filter-bar__label">Em qual unidade ocorreu?</span>
          <CustomSelect
            style={{ minWidth: '200px' }}
            value={filtros.unidade}
            onChange={(val) => setFiltros({ ...filtros, unidade: val })}
            defaultOption="Todas as unidades"
            allowEmpty={true}
            options={UNIDADES.map(u => ({ value: u, label: u }))}
          />
        </div>

        {/* Ordem */}
        <div className="filter-bar__group" style={{ minWidth: '180px' }}>
          <span className="filter-bar__label">Ordem:</span>
          <CustomSelect
            style={{ minWidth: '180px' }}
            value={filtros.ordem}
            onChange={(val) => setFiltros({ ...filtros, ordem: val })}
            defaultOption="Selecione a ordem"
            allowEmpty={false}
            options={[
              { value: 'recentes', label: 'Mais recentes primeiro' },
              { value: 'antigos', label: 'Mais antigos primeiro' }
            ]}
          />
        </div>

        {/* Prioridade */}
        {status === 'em_andamento' && (
          <div className="filter-bar__group" style={{ minWidth: '190px' }}>
            <span className="filter-bar__label">Prioridade:</span>
            <CustomSelect
              style={{ minWidth: '190px' }}
              value={filtros.prioridadeOrdem}
              onChange={(val) => setFiltros({ ...filtros, prioridadeOrdem: val })}
              defaultOption="Sem prioridade"
              allowEmpty={true}
              options={[
                { value: 'maior_prioridade', label: 'Maior prioridade primeiro' },
                { value: 'menor_prioridade', label: 'Menor prioridade primeiro' }
              ]}
            />
          </div>
        )}

        {/* Ações de Filtro */}
        <div className="filter-bar__actions" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginLeft: 'auto', minHeight: '40px' }}>
          <button className="btn btn--limpar" onClick={onLimpar} type="button" style={{ minHeight: '40px', height: '40px', padding: '0 20px', borderRadius: 'var(--radius-full)' }}>
            Limpar
          </button>
          <button className="btn btn--aplicar" onClick={onAplicar} type="button" style={{ minHeight: '40px', height: '40px', padding: '0 20px', borderRadius: 'var(--radius-full)' }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
