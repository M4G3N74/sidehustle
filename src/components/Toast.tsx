'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: '#10b981',
    text: '#6ee7b7',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#ef4444',
    text: '#fca5a5',
  },
  info: {
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.3)',
    icon: '#6366f1',
    text: '#a5b4fc',
  },
};

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className="pointer-events-auto"
      style={{
        background: colors.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(120%)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Icon style={{ width: '1.25rem', height: '1.25rem', color: colors.icon, flexShrink: 0 }} />
      <span style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          padding: '0.25rem',
          flexShrink: 0,
        }}
        aria-label="Dismiss notification"
      >
        <X style={{ width: '1rem', height: '1rem' }} />
      </button>
    </div>
  );
}
