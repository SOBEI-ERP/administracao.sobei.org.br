'use client';

import { UNIDADES } from '@/lib/mockData';
import CustomSelect from './CustomSelect';

export default function FilterBar({ filtros, setFiltros, onAplicar, onLimpar, status }) {
  return (
    <div className="filter-bar">
      {/* Tipo de denúncia */}
      <div className="filter-bar__group">
        <span className="filter-bar__label">Tipo de denuncia:</span>
        <div className="radio-group" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <label className="radio-option">
            <input
              type="radio"
              name="filtro-tipo"
              value="anonima"
              checked={filtros.tipo === 'anonima'}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            />
            Denúncia anônima
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="filtro-tipo"
              value="identificada"
              checked={filtros.tipo === 'identificada'}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            />
            Denúncia identificada
          </label>
        </div>
      </div>

      {/* Unidade */}
      <div className="filter-bar__group">
        <span className="filter-bar__label">Em qual unidade ocorreu?</span>
        <CustomSelect
          style={{ minWidth: '200px' }}
          value={filtros.unidade}
          onChange={(val) => setFiltros({ ...filtros, unidade: val })}
          defaultOption="Selecione a unidade"
          options={UNIDADES.map(u => ({ value: u, label: u }))}
        />
      </div>

      {/* Ordem */}
      <div className="filter-bar__group">
        <span className="filter-bar__label">Ordem:</span>
        <div className="radio-group" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <label className="radio-option">
            <input
              type="radio"
              name="filtro-ordem"
              value="recentes"
              checked={filtros.ordem === 'recentes'}
              onChange={(e) => setFiltros({ ...filtros, ordem: e.target.value })}
            />
            Mais recentes primeiro
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="filtro-ordem"
              value="antigos"
              checked={filtros.ordem === 'antigos'}
              onChange={(e) => setFiltros({ ...filtros, ordem: e.target.value })}
            />
            Mais antigos primeiro
          </label>
          {status === 'em_andamento' && (
            <>
              <label className="radio-option">
                <input
                  type="radio"
                  name="filtro-ordem"
                  value="maior_prioridade"
                  checked={filtros.ordem === 'maior_prioridade'}
                  onChange={(e) => setFiltros({ ...filtros, ordem: e.target.value })}
                />
                Maior prioridade primeiro
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="filtro-ordem"
                  value="menor_prioridade"
                  checked={filtros.ordem === 'menor_prioridade'}
                  onChange={(e) => setFiltros({ ...filtros, ordem: e.target.value })}
                />
                Menor prioridade primeiro
              </label>
            </>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="filter-bar__actions">
        <button className="btn btn--limpar" onClick={onLimpar} type="button">
          Limpar
        </button>
        <button className="btn btn--aplicar" onClick={onAplicar} type="button">
          Aplicar
        </button>
      </div>
    </div>
  );
}
