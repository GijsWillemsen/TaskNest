import { useState } from 'react'
import { X, Gift, Plus } from 'lucide-react'
import { createReward } from '../../services/rewardService'

const PRESET_REWARDS = [
  { title: '1 Hour Video Games 🎮', description: 'Extra 60 minutes of gaming time', cost: 25 },
  { title: 'Pick Tonight’s Dinner 🍕', description: 'Choose favorite meal or pizza night', cost: 40 },
  { title: 'Ice Cream Trip 🍦', description: 'Trip to get your favorite ice cream treat', cost: 30 },
  { title: 'Stay Up 30 Mins Late 🌙', description: 'Push bedtime back by half an hour', cost: 20 },
  { title: 'Family Movie Pick 🎬', description: 'You pick what movie the family watches', cost: 35 },
  { title: 'New Book or Toy 🎁', description: 'Reward trip to choose a new book or toy', cost: 100 },
]

export default function CreateRewardModal({ isOpen, onClose, onRewardCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState(30)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleApplyPreset = (preset) => {
    setTitle(preset.title)
    setDescription(preset.description)
    setCost(preset.cost)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim()) {
      setErrorMsg('Please enter a reward name.')
      return
    }

    setSaving(true)
    try {
      const newReward = await createReward({
        title,
        description,
        cost,
      })
      onRewardCreated(newReward)
      onClose()
      setTitle('')
      setDescription('')
      setCost(30)
    } catch (err) {
      console.error('Failed to create reward:', err)
      setErrorMsg(err.message || 'Could not create reward. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge" style={{ background: 'rgba(243, 156, 18, 0.18)', color: 'var(--discord-orange)' }}>
              <Gift size={20} />
            </div>
            <h2>Create New Reward</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-label">Popular Reward Ideas:</span>
          <div className="presets-scroll">
            {PRESET_REWARDS.map((p) => (
              <button
                key={p.title}
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset(p)}
              >
                {p.title} <span className="preset-chip-pts">{p.cost} pts</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reward-title">Reward Name</label>
            <input
              id="reward-title"
              type="text"
              className="input-field modal-input"
              placeholder="e.g. 1 Hour Screen Time"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reward-desc">Details (optional)</label>
            <textarea
              id="reward-desc"
              rows={2}
              className="input-field modal-textarea"
              placeholder="e.g. Valid on weekend afternoons"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Point Cost</label>
            <div className="points-input-group">
              <input
                type="number"
                min="1"
                max="2000"
                className="input-field modal-input points-number-input"
                value={cost}
                onChange={(e) => setCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <div className="quick-points-pills">
                {[20, 30, 40, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-point-btn ${cost === val ? 'active' : ''}`}
                    onClick={() => setCost(val)}
                  >
                    {val} pts
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-submit" style={{ background: 'var(--discord-orange)' }} disabled={saving}>
              {saving ? 'Creating...' : (
                <>
                  <Plus size={18} />
                  Add Reward ({cost} pts)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

