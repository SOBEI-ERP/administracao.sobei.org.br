'use client';

import { useState } from 'react';
import { IconClose, IconCheck } from '@/components/Icons';

// Lista de oficinas / ministrantes oficiais de referência para agilizar o preenchimento
const OFICINAS_SUGERIDAS = [
  'Cleide Derenzi Valadas',
  'Rodrigo Cândido',
  'Cristiano dos Santos Araujo',
  'Maria Cecília Martin Ferri',
  'Ana Gilda Leocadio',
  'Jaqueline Gomes Silva Veleda',
  'Márcia Curti de Mello',
  'Leila Saita',
  'Erika Aparecida da Silva',
  'Regiane Lays Jacinto de Brito',
  'Liliane Laviano',
  'Talita Regina Lopes de Oliveira Marques',
  'Irene Izilda da Silva',
  'Patrícia Couto Gimael',
  'Raissa Cintra',
  'Shirley Maria de Oliveira',
  'Elaine Maria da Silva',
  'Rose Brito',
  'Ivani Magalhães',
  'Márcia Polacchini',
  'Leticia de Almeida Oliveira',
  'Juliana Neves e Leticia Alves',
];

export default function OficinasModal({ inscrito, onClose, onSave }) {
  const [oficinaManha, setOficinaManha] = useState(inscrito?.oficinaManha || '');
  const [oficinaTarde, setOficinaTarde] = useState(inscrito?.oficinaTarde || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!inscrito) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await onSave(inscrito.id, {
        oficinaManha: oficinaManha.trim(),
        oficinaTarde: oficinaTarde.trim(),
      });
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar oficinas.');
    } finally {
      setSalvando(false);
    }
  };

  const unidadeTexto = inscrito.tipoOsc === 'SOBEI'
    ? (inscrito.unidade?.toUpperCase().startsWith('CEI ') ? inscrito.unidade.toUpperCase() : `CEI ${inscrito.unidade?.toUpperCase() || ''}`)
    : (inscrito.outraOsc || 'OSC / Unidade');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#0c1b33',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
              Definir Oficinas do Participante
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              {inscrito.nomeCompleto} — {unidadeTexto}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
          {erro && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.88rem',
              }}
            >
              {erro}
            </div>
          )}

          {/* Oficina Manhã */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                fontSize: '0.9rem',
                color: '#1f2937',
                marginBottom: '6px',
              }}
            >
              Oficina da Manhã (10h às 13h)
            </label>
            <input
              type="text"
              list="sugestoes-manha"
              value={oficinaManha}
              onChange={(e) => setOficinaManha(e.target.value)}
              placeholder="Digite ou selecione a oficina / palestrante da manhã"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            <datalist id="sugestoes-manha">
              {OFICINAS_SUGERIDAS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          {/* Oficina Tarde */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                fontSize: '0.9rem',
                color: '#1f2937',
                marginBottom: '6px',
              }}
            >
              Oficina da Tarde (14h às 17h)
            </label>
            <input
              type="text"
              list="sugestoes-tarde"
              value={oficinaTarde}
              onChange={(e) => setOficinaTarde(e.target.value)}
              placeholder="Digite ou selecione a oficina / palestrante da tarde"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            <datalist id="sugestoes-tarde">
              {OFICINAS_SUGERIDAS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          {/* Preview em Miniatura do Crachá */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                color: '#64748b',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              Prévia do Crachá Padronizado
            </span>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 18px',
                maxWidth: '380px',
                width: '100%',
                aspectRatio: '285 / 108',
                margin: '0 auto',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div
                  style={{
                    color: '#2E74B5',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    letterSpacing: '0.04em',
                    paddingBottom: '4px',
                    borderBottom: '2px solid #2E74B5',
                  }}
                >
                  {unidadeTexto}
                </div>
              </div>

              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '1.25',
                  padding: '6px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {inscrito.nomeCompleto}
              </div>

              <div style={{ position: 'relative', zIndex: 1, textAlign: 'left', fontSize: '0.85rem', color: '#1f2937' }}>
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: '#111827', fontWeight: '700', minWidth: '60px' }}>MANHÃ:</strong>
                  <span style={{ color: oficinaManha ? '#1e293b' : '#94a3b8', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {oficinaManha || 'A Definir'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: '#111827', fontWeight: '700', minWidth: '60px' }}>TARDE:</strong>
                  <span style={{ color: oficinaTarde ? '#1e293b' : '#94a3b8', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {oficinaTarde || 'A Definir'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: '#0c1b33',
                color: '#ffffff',
                fontWeight: '600',
                cursor: salvando ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {salvando ? (
                'Salvando...'
              ) : (
                <>
                  <IconCheck size={16} /> Salvar Oficinas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
