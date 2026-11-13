import { useState, useEffect, useRef } from 'react'
import jsQR from 'jsqr'
import { X, Camera, AlertCircle, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/useLanguage'

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { isDutch } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)

  const [hasCamera, setHasCamera] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [manualCode, setManualCode] = useState('')

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const parseCodeFromUrlOrText = (raw) => {
    if (!raw) return null
    const str = String(raw).trim()

    // 1. Direct 6-character uppercase alphanumeric code
    if (/^[A-Za-z0-9]{6}$/.test(str)) {
      return str.toUpperCase()
    }

    // 2. URL containing query param ?code=XXXXXX or /code/XXXXXX
    try {
      const url = new URL(str)
      const codeParam = url.searchParams.get('code')
      if (codeParam && /^[A-Za-z0-9]{6}$/.test(codeParam)) {
        return codeParam.toUpperCase()
      }
    } catch {
      // not a standard URL, try regex match
      const match = str.match(/code=([A-Za-z0-9]{6})/i)
      if (match && match[1]) {
        return match[1].toUpperCase()
      }
    }

    return null
  }

  const scanFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Method 1: Native BarcodeDetector (Modern Android & iOS Chrome/Safari)
    let detectedRaw = null
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        detector.detect(video).then((barcodes) => {
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const extracted = parseCodeFromUrlOrText(barcodes[0].rawValue)
            if (extracted) {
              if (navigator.vibrate) {
                try {
                  navigator.vibrate([40, 30, 40])
                } catch {
                  // ignore
                }
              }
              stopCamera()
              onScanSuccess(extracted)
              return
            }
          }
        }).catch(() => {})
      } catch {
        // Fallback to jsQR
      }
    }

    // Method 2: jsQR fallback
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (qrCode && qrCode.data) {
        detectedRaw = qrCode.data
      }
    } catch {
      // ignore
    }

    if (detectedRaw) {
      const extracted = parseCodeFromUrlOrText(detectedRaw)
      if (extracted) {
        if (navigator.vibrate) {
          try {
            navigator.vibrate([40, 30, 40])
          } catch {
            // ignore
          }
        }
        stopCamera()
        onScanSuccess(extracted)
        return
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame)
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    let isMounted = true

    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) {
            setHasCamera(false)
            setCameraError(
              isDutch
                ? 'Cameratoegang wordt niet ondersteund door deze browser. Voer de code handmatig in.'
                : 'Camera access is not supported by your browser. Please enter the code manually.'
            )
          }
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
          scanFrame()
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Camera stream error:', err)
          setHasCamera(false)
          setCameraError(
            isDutch
              ? 'Cameratoegang is geweigerd of geblokkeerd. Geef cameratoestemming in je browser of voer de code hieronder in.'
              : 'Camera permission denied or unavailable. Grant camera permission or type the code below.'
          )
        }
      }
    }

    initCamera()

    return () => {
      isMounted = false
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isDutch])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const clean = manualCode.trim().toUpperCase()
    if (clean.length === 6) {
      stopCamera()
      onScanSuccess(clean)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          width: '92%',
          background: 'var(--bg-surface)',
          padding: '1.4rem',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
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
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                {isDutch ? 'Scan Gezins QR-code' : 'Scan Family QR Code'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isDutch ? 'Richt de camera op de QR-code' : 'Point camera at the QR code'}
              </span>
            </div>
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

        {/* Viewfinder or Camera Error */}
        {hasCamera && !cameraError ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '280px',
              borderRadius: '18px',
              overflow: 'hidden',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Target Reticle Viewport */}
            <div
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '20px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
              }}
            >
              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '24px', height: '24px', borderTop: '4px solid var(--theme-accent, #5865F2)', borderLeft: '4px solid var(--theme-accent, #5865F2)', borderTopLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '24px', height: '24px', borderTop: '4px solid var(--theme-accent, #5865F2)', borderRight: '4px solid var(--theme-accent, #5865F2)', borderTopRightRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '24px', height: '24px', borderBottom: '4px solid var(--theme-accent, #5865F2)', borderLeft: '4px solid var(--theme-accent, #5865F2)', borderBottomLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', borderBottom: '4px solid var(--theme-accent, #5865F2)', borderRight: '4px solid var(--theme-accent, #5865F2)', borderBottomRightRadius: '16px' }} />

              {/* Animated Laser Scan Line */}
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  right: '10px',
                  height: '2.5px',
                  background: 'linear-gradient(90deg, transparent, var(--theme-accent, #5865F2), #38bdf8, transparent)',
                  boxShadow: '0 0 10px var(--theme-accent, #5865F2)',
                  animation: 'qr-laser-scan 2s infinite ease-in-out',
                }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                padding: '4px 12px',
                borderRadius: '20px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={12} color="#38bdf8" />
              <span>{isDutch ? 'Zoeken naar QR-code...' : 'Scanning for QR code...'}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={28} color="var(--discord-red, #ef4444)" style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-pure)', lineHeight: 1.4 }}>
              {cameraError}
            </p>
          </div>
        )}

        {/* Manual fallback code input */}
        <form onSubmit={handleManualSubmit} style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            {isDutch ? 'Of voer de 6-letterige code in:' : 'Or enter the 6-letter code:'}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              maxLength={6}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="bijv. 2D8ZED"
              className="input-field"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            />
            <button
              type="submit"
              disabled={manualCode.trim().length !== 6}
              className="auth-submit-btn action-btn-primary"
              style={{ width: 'auto', margin: 0, padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}
            >
              {isDutch ? 'Toepassen' : 'Apply'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes qr-laser-scan {
          0% { top: 12px; opacity: 0.9; }
          50% { top: 180px; opacity: 1; }
          100% { top: 12px; opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
