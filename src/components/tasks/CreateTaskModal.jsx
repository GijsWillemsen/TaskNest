import { useState } from 'react'
import { X, Sparkles, Plus } from 'lucide-react'
import { createTask } from '../../services/taskService'

const PRESET_CHORES = [
  { title: 'Clean Bedroom 🛏️', description: 'Make bed, pick up clothes, tidy desk', points: 15 },
  { title: 'Wash Dishes 🍽️', description: 'Load/unload dishwasher or wash sink dishes', points: 20 },
  { title: 'Take Out Trash 🗑️', description: 'Empty room bins and take trash to the curb', points: 10 },
  { title: 'Finish Homework 📚', description: 'Complete all assignments for school tomorrow', points: 25 },
  { title: 'Walk / Feed Pet 🐕', description: 'Take pet for a 15-minute walk and refill bowl', points: 15 },
  { title: 'Vacuum Living Room 🧹', description: 'Vacuum rug and sweep entryway', points: 20 },
]

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsValue, setPointsValue] = useState(15)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleApplyPreset = (preset) => {
    setTitle(preset.title)
    setDescription(preset.description)
    setPointsValue(preset.points)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim()) {
      setErrorMsg('Please give the chore a title.')
      return
    }

    setSaving(true)
    try {
      const newTask = await createTask({
        title,
        description,
        points_value: pointsValue,
      })
      onTaskCreated(newTask)
      onClose()
      setTitle('')
      setDescription('')
      setPointsValue(15)
    } catch (err) {
      console.error('Failed to create chore:', err)
      setErrorMsg(err.message || 'Could not create chore. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <h2>Create New Chore</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-label">Quick Ideas:</span>
          <div className="presets-scroll">
            {PRESET_CHORES.map((p) => (
              <button
                key={p.title}
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset(p)}
              >
                {p.title} <span className="preset-chip-pts">+{p.points}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="chore-title">Chore Name</label>
            <input
              id="chore-title"
              type="text"
              className="input-field modal-input"
              placeholder="e.g. Wash the dishes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="chore-desc">Details & Instructions (optional)</label>
            <textarea
              id="chore-desc"
              rows={3}
              className="input-field modal-textarea"
              placeholder="What needs to be done? e.g. Wipe counters when done"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Point Reward Value</label>
            <div className="points-input-group">
              <input
                type="number"
                min="1"
                max="500"
                className="input-field modal-input points-number-input"
                value={pointsValue}
                onChange={(e) => setPointsValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <div className="quick-points-pills">
                {[10, 15, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-point-btn ${pointsValue === val ? 'active' : ''}`}
                    onClick={() => setPointsValue(val)}
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
            <button type="submit" className="modal-btn-submit" disabled={saving}>
              {saving ? 'Creating...' : (
                <>
                  <Plus size={18} />
                  Add Chore (+{pointsValue} pts)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
