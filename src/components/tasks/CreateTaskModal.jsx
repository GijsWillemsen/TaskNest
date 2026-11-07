import { useState } from 'react'
import { X, Plus, RotateCw, Clock, Calendar } from 'lucide-react'
import { createTask } from '../../services/taskService'
import { useLanguage } from '../../context/useLanguage'

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, familyId }) {
  const { t, isDutch } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsValue, setPointsValue] = useState(15)
  const [recurrence, setRecurrence] = useState('none') // 'none', 'daily', 'weekly', 'monthly', 'yearly'
  const [recurrenceTime, setRecurrenceTime] = useState('')
  const [recurrenceDay, setRecurrenceDay] = useState('monday')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const presets = isDutch
    ? [
        { title: 'Slaapkamer opruimen 🛏️', description: 'Bed opmaken, kleren opruimen, bureau netjes', points: 15, rec: 'daily', time: '10:00' },
        { title: 'Vaatwasser uitruimen 🍽️', description: 'Vaatwasser inruimen of uitruimen', points: 20, rec: 'daily', time: '18:00' },
        { title: 'Vuilnis buiten zetten 🗑️', description: 'Prullenbakken legen en containers aan de straat', points: 10, rec: 'weekly', day: 'tuesday', time: '19:00' },
        { title: 'Huiswerk afronden 📚', description: 'Alle opdrachten en leerwerk voor school afmaken', points: 25, rec: 'daily', time: '16:00' },
        { title: 'Hond uitlaten 🐕', description: '15 minuten wandelen en bak vers water geven', points: 15, rec: 'daily', time: '17:00' },
        { title: 'Woonkamer stofzuigen 🧹', description: 'Vloerkleed zuigen en hal vegen', points: 20, rec: 'weekly', day: 'saturday', time: '11:00' },
      ]
    : [
        { title: 'Clean Bedroom 🛏️', description: 'Make bed, pick up clothes, tidy desk', points: 15, rec: 'daily', time: '10:00' },
        { title: 'Wash Dishes 🍽️', description: 'Load/unload dishwasher or wash sink dishes', points: 20, rec: 'daily', time: '18:00' },
        { title: 'Take Out Trash 🗑️', description: 'Empty room bins and take trash to the curb', points: 10, rec: 'weekly', day: 'tuesday', time: '19:00' },
        { title: 'Finish Homework 📚', description: 'Complete all assignments for school tomorrow', points: 25, rec: 'daily', time: '16:00' },
        { title: 'Walk / Feed Pet 🐕', description: 'Take pet for a 15-minute walk and refill bowl', points: 15, rec: 'daily', time: '17:00' },
        { title: 'Vacuum Living Room 🧹', description: 'Vacuum rug and sweep entryway', points: 20, rec: 'weekly', day: 'saturday', time: '11:00' },
      ]

  if (!isOpen) return null

  const handleApplyPreset = (preset) => {
    setTitle(preset.title)
    setDescription(preset.description)
    setPointsValue(preset.points)
    if (preset.rec) setRecurrence(preset.rec)
    if (preset.time) setRecurrenceTime(preset.time)
    if (preset.day) setRecurrenceDay(preset.day)
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
        recurrence,
        recurrence_time: recurrence !== 'none' && recurrenceTime ? recurrenceTime : null,
        recurrence_day: recurrence === 'weekly' ? recurrenceDay : null,
      })
      onTaskCreated(newTask)
      onClose()
      setTitle('')
      setDescription('')
      setPointsValue(15)
      setRecurrence('none')
      setRecurrenceTime('')
      setRecurrenceDay('monday')
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
            <h2>{t('tasks.create_title')}</h2>
          </div>
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
              rows={2}
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

          {/* Recurrence Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <RotateCw size={15} />
              {t('tasks.field_recurrence')}
            </label>
            <div className="recurrence-grid">
              {[
                { id: 'none', label: t('tasks.recurrence_none'), icon: '📌' },
                { id: 'daily', label: t('tasks.recurrence_daily'), icon: '☀️' },
                { id: 'weekly', label: t('tasks.recurrence_weekly'), icon: '📅' },
                { id: 'monthly', label: t('tasks.recurrence_monthly'), icon: '🗓️' },
                { id: 'yearly', label: t('tasks.recurrence_yearly'), icon: '🎂' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`recurrence-choice-btn ${recurrence === item.id ? 'active' : ''}`}
                  onClick={() => setRecurrence(item.id)}
                >
                  <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Recurrence Time & Day Options */}
          {recurrence !== 'none' && (
            <div className="recurrence-details-box">
              {/* Specific Time */}
              <div className="form-group" style={{ marginBottom: recurrence === 'weekly' ? '0.75rem' : 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Clock size={14} />
                  {t('tasks.field_time')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="time"
                    className="input-field modal-input"
                    style={{ maxWidth: '130px', padding: '0.45rem 0.65rem', fontSize: '0.9rem' }}
                    value={recurrenceTime}
                    onChange={(e) => setRecurrenceTime(e.target.value)}
                  />
                  <div className="quick-time-chips">
                    {['08:00', '12:30', '18:00', '20:00'].map((timeStr) => (
                      <button
                        key={timeStr}
                        type="button"
                        className={`quick-time-chip ${recurrenceTime === timeStr ? 'active' : ''}`}
                        onClick={() => setRecurrenceTime(recurrenceTime === timeStr ? '' : timeStr)}
                      >
                        {timeStr}
                      </button>
                    ))}
                    {recurrenceTime && (
                      <button
                        type="button"
                        className="quick-time-chip clear-chip"
                        onClick={() => setRecurrenceTime('')}
                        title={isDutch ? 'Wissen' : 'Clear'}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Day of Week */}
              {recurrence === 'weekly' && (
                <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <Calendar size={14} />
                    {t('tasks.field_day_of_week')}
                  </label>
                  <div className="weekday-selector">
                    {[
                      { id: 'monday', label: isDutch ? 'Ma' : 'Mo', full: isDutch ? 'Maandag' : 'Monday' },
                      { id: 'tuesday', label: isDutch ? 'Di' : 'Tu', full: isDutch ? 'Dinsdag' : 'Tuesday' },
                      { id: 'wednesday', label: isDutch ? 'Wo' : 'We', full: isDutch ? 'Woensdag' : 'Wednesday' },
                      { id: 'thursday', label: isDutch ? 'Do' : 'Th', full: isDutch ? 'Donderdag' : 'Thursday' },
                      { id: 'friday', label: isDutch ? 'Vr' : 'Fr', full: isDutch ? 'Vrijdag' : 'Friday' },
                      { id: 'saturday', label: isDutch ? 'Za' : 'Sa', full: isDutch ? 'Zaterdag' : 'Saturday' },
                      { id: 'sunday', label: isDutch ? 'Zo' : 'Su', full: isDutch ? 'Zondag' : 'Sunday' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        title={d.full}
                        className={`weekday-chip ${recurrenceDay === d.id ? 'active' : ''}`}
                        onClick={() => setRecurrenceDay(d.id)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="modal-btn-submit" disabled={saving}>
              {saving ? t('common.saving') : (
                <>
                  <Plus size={18} />
                  {t('tasks.submit_create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
