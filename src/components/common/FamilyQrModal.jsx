import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { X, Copy, Check, Share2, QrCode } from 'lucide-react'
import { useLanguage } from '../../context/useLanguage'

export default function FamilyQrModal({ isOpen, onClose, familyName, inviteCode }) {
  const { isDutch } = useLanguage()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [generating, setGenerating] = useState(true)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?code=${inviteCode || ''}`
    : `https://tasknest.app/signup?code=${inviteCode || ''}`

  useEffect(() => {
    if (!isOpen || !inviteCode) return

    let isMounted = true
    QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url)
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, inviteCode, inviteUrl])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sluit je aan bij ${familyName || 'TaskNest'}!`,
          text: isDutch
            ? `Word lid van ons gezin op TaskNest met code ${inviteCode}!`
            : `Join our family on TaskNest with code ${inviteCode}!`,
          url: inviteUrl,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink()
        }
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '420px',
          width: '92%',
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--theme-accent, var(--discord-blurple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-pure)' }}>
              {isDutch ? 'Gezins QR-code' : 'Family QR Code'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {isDutch
            ? `Laat je partner of kind deze QR-code scannen met hun camera om direct lid te worden van ${familyName || 'het gezin'}.`
            : `Have your partner or child scan this QR code with their phone camera to join ${familyName || 'your family'} instantly.`}
        </p>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '2px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          {generating ? (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <span>{isDutch ? 'QR-code genereren...' : 'Generating QR code...'}</span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Family Invite QR Code"
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
            />
          ) : null}
        </div>

        {/* 6-Letter Code Display */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            {isDutch ? 'OF GEBRUIK DE 6-LETTERIGE CODE' : 'OR USE THE 6-LETTER CODE'}
          </span>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              letterSpacing: '0.22em',
              color: 'var(--theme-accent, var(--discord-blurple))',
              fontFamily: 'monospace',
            }}
          >
            {inviteCode}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              border: '1.5px solid var(--border-subtle)',
              background: copiedLink ? 'var(--discord-green)' : 'var(--bg-surface-elevated)',
              color: copiedLink ? '#090a0f' : 'var(--text-pure)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedLink ? (isDutch ? 'Gekopieerd!' : 'Copied!') : (isDutch ? 'Kopieer Link' : 'Copy Link')}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="auth-submit-btn action-btn-primary"
            style={{
              width: 'auto',
              margin: 0,
              padding: '0.65rem 1.25rem',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Share2 size={16} />
            <span>{isDutch ? 'Deel Uitnodiging' : 'Share Invite'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
