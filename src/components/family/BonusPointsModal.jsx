import { useState } from 'react'
import { X, Gift, Plus } from 'lucide-react'
import { awardBonusPoints } from '../../services/profileService'

export default function BonusPointsModal({
  isOpen,
  onClose,
  kid,
  onPointsAwarded,
}) {
  const [points, setPoints] = useState(10)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen || !kid) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (points <= 0) {
      setErrorMsg('Please specify points greater than 0.')
      return
    }

    setSaving(true)
    try {
      const updatedProfile = await awardBonusPoints(kid.id, points)
      if (onPointsAwarded) onPointsAwarded(updatedProfile)
      onClose()
    } catch (err) {
      console.error('Failed to grant bonus points:', err)
      setErrorMsg(err.message || 'Could not award bonus points.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge" style={{ background: 'rgba(254, 231, 92, 0.2)', color: 'var(--discord-yellow)' }}>
              <Gift size={20} />
            </div>
            <h2>Award Bonus Points</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Grant extra reward points to <strong>Kid ({kid.id.slice(0, 8)}...)</strong> for good behavior, helping out, or extra effort!
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Bonus Points Amount</label>
            <div className="points-input-group">
              <input
                type="number"
                min="1"
                max="500"
                className="input-field modal-input points-number-input"
                value={points}
                onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <div className="quick-points-pills">
                {[5, 10, 15, 25, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-point-btn ${points === val ? 'active' : ''}`}
                    onClick={() => setPoints(val)}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              style={{ background: 'var(--discord-yellow)', color: '#000000', fontWeight: 700 }}
              disabled={saving}
            >
              {saving ? 'Awarding...' : (
                <>
                  <Plus size={18} />
                  Award +{points} Points
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

