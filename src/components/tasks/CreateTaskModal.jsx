import { useState } from 'react'
import { X, Sparkles, Plus } from 'lucide-react'
import { createTask } from '../../services/taskService'
import { useLanguage } from '../../context/useLanguage'

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, familyId }) {
  const { t, isDutch } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsValue, setPointsValue] = useState(15)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const presets = isDutch
    ? [
        { title: 'Slaapkamer opruimen 🛏️', description: 'Bed opmaken, kleren opruimen, bureau netjes', points: 15 },
        { title: 'Vaatwasser uitruimen 🍽️', description: 'Vaatwasser inruimen of uitruimen', points: 20 },
        { title: 'Vuilnis buiten zetten 🗑️', description: 'Prullenbakken legen en containers aan de straat', points: 10 },
        { title: 'Huiswerk afronden 📚', description: 'Alle opdrachten en leerwerk voor school afmaken', points: 25 },
        { title: 'Hond uitlaten 🐕', description: '15 minuten wandelen en bak vers water geven', points: 15 },
        { title: 'Woonkamer stofzuigen 🧹', description: 'Vloerkleed zuigen en hal vegen', points: 20 },
      ]
    : [
        { title: 'Clean Bedroom 🛏️', description: 'Make bed, pick up clothes, tidy desk', points: 15 },
        { title: 'Wash Dishes 🍽️', description: 'Load/unload dishwasher or wash sink dishes', points: 20 },
        { title: 'Take Out Trash 🗑️', description: 'Empty room bins and take trash to the curb', points: 10 },
        { title: 'Finish Homework 📚', description: 'Complete all assignments for school tomorrow', points: 25 },
        { title: 'Walk / Feed Pet 🐕', description: 'Take pet for a 15-minute walk and refill bowl', points: 15 },
        { title: 'Vacuum Living Room 🧹', description: 'Vacuum rug and sweep entryway', points: 20 },
      ]

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
      setErrorMsg(isDutch ? 'Geef het klusje een titel.' : 'Please give the chore a title.')
      return
    }

    setSaving(true)
    try {
      const newTask = await createTask({
        familyId,
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
      setErrorMsg(err.message || (isDutch ? 'Kon klusje niet aanmaken.' : 'Could not create chore. Please try again.'))
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
            <h2>{t('tasks.create_title')}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-label">{t('tasks.quick_presets')}</span>
          <div className="presets-scroll">
            {presets.map((p) => (
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
            <label className="form-label" htmlFor="chore-title">{t('tasks.field_title')}</label>
            <input
              id="chore-title"
              type="text"
              className="input-field modal-input"
              placeholder={t('tasks.field_title_placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="chore-desc">{t('tasks.field_desc')}</label>
            <textarea
              id="chore-desc"
              rows={3}
              className="input-field modal-textarea"
              placeholder={t('tasks.field_desc_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('tasks.field_points')}</label>
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
              {t('common.cancel')}
            </button>
            <button type="submit" className="modal-btn-submit" disabled={saving}>
              {saving ? t('common.saving') : (
                <>
                  <Plus size={18} />
                  {t('tasks.submit_create')} ({pointsValue})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
