import { useState } from 'react'
import { X, Gift, Plus } from 'lucide-react'
import { createReward } from '../../services/rewardService'
import { useLanguage } from '../../context/useLanguage'

export default function CreateRewardModal({ isOpen, onClose, onRewardCreated, familyId }) {
  const { t, isDutch } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState(30)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const presets = isDutch
    ? [
        { title: '1 Uur Gamen', description: '60 minuten extra gametijd op computer of console', cost: 25 },
        { title: 'Favoriet Avondeten Kiezen', description: 'Jij kiest wat we vanavond eten (bijv. pizza of pannenkoeken)', cost: 40 },
        { title: 'IJsje Halen', description: 'Samen naar de ijssalon voor jouw favoriete ijsje', cost: 30 },
        { title: '30 Min Later naar Bed', description: 'Bedtijd een half uurtje opschuiven in het weekend', cost: 20 },
        { title: 'Film Kiezen voor het Gezin', description: 'Jij kiest de film voor de filmavond', cost: 35 },
        { title: 'Nieuw Boek of Speelgoed', description: 'Een leuk cadeautje of boek uitzoeken in de winkel', cost: 100 },
      ]
    : [
        { title: '1 Hour Video Games', description: 'Extra 60 minutes of gaming time', cost: 25 },
        { title: 'Pick Tonight’s Dinner', description: 'Choose favorite meal or pizza night', cost: 40 },
        { title: 'Ice Cream Trip', description: 'Trip to get your favorite ice cream treat', cost: 30 },
        { title: 'Stay Up 30 Mins Late', description: 'Push bedtime back by half an hour', cost: 20 },
        { title: 'Family Movie Pick', description: 'You pick what movie the family watches', cost: 35 },
        { title: 'New Book or Toy', description: 'Reward trip to choose a new book or toy', cost: 100 },
      ]

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
      setErrorMsg(isDutch ? 'Voer een naam in voor de beloning.' : 'Please enter a reward name.')
      return
    }

    setSaving(true)
    try {
      const newReward = await createReward({
        familyId,
        title,
        description,
        cost: parseInt(cost, 10) || 20,
      })
      onRewardCreated(newReward)
      onClose()
      setTitle('')
      setDescription('')
      setCost(30)
    } catch (err) {
      console.error('Failed to create reward:', err)
      setErrorMsg(err.message || (isDutch ? 'Kon beloning niet aanmaken.' : 'Could not create reward. Please try again.'))
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
            <h2>{t('rewards.create_title')}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-label">{isDutch ? 'Populaire Beloningen:' : 'Popular Reward Ideas:'}</span>
          <div className="presets-scroll">
            {presets.map((p) => (
              <button
                key={p.title}
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset(p)}
              >
                {p.title} <span className="preset-chip-pts">🪙 {p.cost}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reward-title">{t('rewards.field_title')}</label>
            <input
              id="reward-title"
              type="text"
              className="input-field modal-input"
              placeholder={t('rewards.field_title_placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reward-desc">{t('rewards.field_desc')}</label>
            <textarea
              id="reward-desc"
              rows={2}
              className="input-field modal-textarea"
              placeholder={t('rewards.field_desc_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('rewards.field_cost')}</label>
            <div className="points-input-group">
              <input
                type="number"
                min="1"
                max="2000"
                className="input-field modal-input points-number-input"
                value={cost}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    setCost('')
                  } else {
                    const num = parseInt(raw, 10)
                    if (!isNaN(num)) setCost(num)
                  }
                }}
                onBlur={() => {
                  if (!cost || Number(cost) < 1) {
                    setCost(20)
                  }
                }}
              />
              <div className="quick-points-pills">
                {[20, 30, 40, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-point-btn ${cost === val ? 'active' : ''}`}
                    onClick={() => setCost(val)}
                  >
                    🪙 {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="modal-btn-submit" style={{ background: 'var(--discord-orange)' }} disabled={saving}>
              {saving ? t('common.saving') : (
                <>
                  <Plus size={18} />
                  {t('rewards.submit_create')} ({cost})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

