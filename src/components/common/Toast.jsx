import { useEffect } from 'react'
import { ShieldAlert, CheckCircle2, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  const isError = type === 'error'
  const isSuccess = type === 'success'

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.85rem 1.15rem',
        borderRadius: '10px',
        backgroundColor: isError
          ? 'rgba(237, 66, 69, 0.15)'
          : isSuccess
          ? 'rgba(87, 242, 135, 0.15)'
          : 'rgba(88, 101, 242, 0.15)',
        border: `1px solid ${
          isError
            ? 'rgba(237, 66, 69, 0.5)'
            : isSuccess
            ? 'rgba(87, 242, 135, 0.5)'
            : 'rgba(88, 101, 242, 0.5)'
        }`,
        color: isError ? '#ff7b7d' : isSuccess ? 'var(--discord-green)' : '#828df7',
        fontSize: '0.88rem',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        animation: 'fadeIn 0.2s ease',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {isError && <ShieldAlert size={18} style={{ flexShrink: 0 }} />}
        {isSuccess && <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
        {!isError && !isSuccess && <Info size={18} style={{ flexShrink: 0 }} />}
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.8,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

