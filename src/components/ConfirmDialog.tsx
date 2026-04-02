'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{
        backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        transition: 'all 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        style={{
          background: 'rgba(15, 12, 41, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <h3
          id="confirm-dialog-title"
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: isDanger ? '#fca5a5' : 'white',
          }}
        >
          {title}
        </h3>
        <div
          id="confirm-dialog-message"
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          {message}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              background: isDanger
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              border: 'none',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s, box-shadow 0.2s',
              boxShadow: isDanger
                ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                : '0 4px 15px rgba(124, 58, 237, 0.4)',
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
