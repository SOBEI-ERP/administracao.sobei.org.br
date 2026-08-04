'use client';

import { useEffect } from 'react';
import { IconWarning, IconTrash, IconCheckCircle, IconClose } from '@/components/Icons';

/**
 * ConfirmModal — Modal de Confirmação / Alerta para o Painel Admin da SOBEI
 *
 * @param {boolean} isOpen - Controla a visibilidade do modal
 * @param {string} title - Título do modal
 * @param {string|React.ReactNode} message - Mensagem ou conteúdo interno
 * @param {'danger' | 'warning' | 'info' | 'success'} type - Tipo do modal (define cores e ícones)
 * @param {string} confirmText - Texto do botão de confirmação (padrão: "Confirmar")
 * @param {string} cancelText - Texto do botão de cancelamento (se omitido, atua como modal apenas com botão "Entendido")
 * @param {function} onConfirm - Callback acionado ao clicar em confirmar
 * @param {function} onClose - Callback acionado ao fechar ou cancelar
 * @param {boolean} loading - Estado de carregamento da ação
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  loading = false,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose?.();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isAlertOnly = !cancelText && !onConfirm;

  const typeConfig = {
    danger: {
      icon: <IconTrash size={40} style={{ color: '#dc2626' }} />,
      iconBg: '#fef2f2',
      confirmBtnBg: '#dc2626',
    },
    warning: {
      icon: <IconWarning size={40} style={{ color: '#d97706' }} />,
      iconBg: '#fffbeb',
      confirmBtnBg: '#d97706',
    },
    info: {
      icon: <IconWarning size={40} style={{ color: '#2563eb' }} />,
      iconBg: '#eff6ff',
      confirmBtnBg: 'var(--color-primary, #1b1464)',
    },
    success: {
      icon: <IconCheckCircle size={40} style={{ color: '#16a34a' }} />,
      iconBg: '#f0fdf4',
      confirmBtnBg: '#16a34a',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1200 }}
      onClick={() => {
        if (!loading) onClose?.();
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          padding: '28px 24px',
          textAlign: 'center',
          borderRadius: '16px',
        }}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar modal"
        >
          <IconClose size={18} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {config.icon}
        </div>

        {title && (
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-gray-900, #111827)',
              margin: '0 0 10px 0',
            }}
          >
            {title}
          </h2>
        )}

        {message && (
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--color-gray-600, #4b5563)',
              marginBottom: '24px',
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: isAlertOnly ? 'center' : 'flex-end',
          }}
        >
          {!isAlertOnly && cancelText && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={isAlertOnly ? onClose : onConfirm}
            disabled={loading}
            style={{
              flex: isAlertOnly ? 'none' : 1,
              minWidth: isAlertOnly ? '120px' : 'auto',
              backgroundColor: config.confirmBtnBg,
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Aguarde...' : isAlertOnly ? (confirmText || 'Entendido') : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
