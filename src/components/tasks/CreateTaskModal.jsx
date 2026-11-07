import { useState } from 'react'
import { X, Plus, RotateCw, Clock, Calendar, Users } from 'lucide-react'
import { createTask } from '../../services/taskService'
import { useLanguage } from '../../context/useLanguage'

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKEND = ['saturday', 'sunday']

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, familyId, familyMembers = [] }) {
  const { t, isDutch } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsValue, setPointsValue] = useState(15)
  const [assignedTo, setAssignedTo] = useState(null) // null = open for anyone, or profile id
  const [recurrence, setRecurrence] = useState('none') // 'none', 'daily', 'weekly', 'monthly', 'yearly'
  const [recurrenceTime, setRecurrenceTime] = useState('')
  const [selectedDays, setSelectedDays] = useState(['monday'])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const presets = isDutch
    ? [
        { title: 'Slaapkamer opruimen 🛏️', description: 'Bed opmaken, kleren opruimen, bureau netjes', points: 15, rec: 'daily', time: '10:00' },
        { title: 'Vaatwasser uitruimen 🍽️', description: 'Vaatwasser inruimen of uitruimen', points: 20, rec: 'daily', time: '18:00' },
        { title: 'Vuilnis buiten zetten 🗑️', description: 'Prullenbakken legen en containers aan de straat', points: 10, rec: 'weekly', days: ['tuesday'], time: '19:00' },
        { title: 'Huiswerk afronden 📚', description: 'Alle opdrachten en leerwerk voor school afmaken', points: 25, rec: 'weekly', days: WEEKDAYS, time: '16:00' },
        { title: 'Hond uitlaten 🐕', description: '15 minuten wandelen en bak vers water geven', points: 15, rec: 'daily', time: '17:00' },
        { title: 'Woonkamer stofzuigen 🧹', description: 'Vloerkleed zuigen en hal vegen', points: 20, rec: 'weekly', days: ['saturday'], time: '11:00' },
      ]
    : [
        { title: 'Clean Bedroom 🛏️', description: 'Make bed, pick up clothes, tidy desk', points: 15, rec: 'daily', time: '10:00' },
        { title: 'Wash Dishes 🍽️', description: 'Load/unload dishwasher or wash sink dishes', points: 20, rec: 'daily', time: '18:00' },
        { title: 'Take Out Trash 🗑️', description: 'Empty room bins and take trash to the curb', points: 10, rec: 'weekly', days: ['tuesday'], time: '19:00' },
        { title: 'Finish Homework 📚', description: 'Complete all assignments for school tomorrow', points: 25, rec: 'weekly', days: WEEKDAYS, time: '16:00' },
        { title: 'Walk / Feed Pet 🐕', description: 'Take pet for a 15-minute walk and refill bowl', points: 15, rec: 'daily', time: '17:00' },
        { title: 'Vacuum Living Room 🧹', description: 'Vacuum rug and sweep entryway', points: 20, rec: 'weekly', days: ['saturday'], time: '11:00' },
      ]

  if (!isOpen) return null

  const handleApplyPreset = (preset) => {
    setTitle(preset.title)
    setDescription(preset.description)
    setPointsValue(preset.points)
    if (preset.rec) {
      setRecurrence(preset.rec)
      if (preset.rec === 'daily') setSelectedDays(ALL_DAYS)
    }
    if (preset.days) setSelectedDays(preset.days)
    if (preset.time) setRecurrenceTime(preset.time)
  }

  const handleRecurrenceChange = (recId) => {
    setRecurrence(recId)
    if (recId === 'daily') {
      setSelectedDays(ALL_DAYS)
    } else if (recId === 'weekly' && selectedDays.length === 7) {
      setSelectedDays(['monday'])
    }
  }

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId))
      }
    } else {
      setSelectedDays([...selectedDays, dayId])
    }
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
      const isAssigned = Boolean(assignedTo)
      const daysString = (recurrence === 'weekly' || recurrence === 'daily') && selectedDays.length > 0
        ? selectedDays.join(',')
        : null

      const newTask = await createTask({
        familyId,
        title,
        description,
        points_value: pointsValue,
        recurrence,
        recurrence_time: recurrence !== 'none' && recurrenceTime ? recurrenceTime : null,
        recurrence_day: daysString,
        assigned_to: assignedTo || null,
        claimed_by: assignedTo || null,
        status: isAssigned ? 'claimed' : 'open',
      })

      onTaskCreated(newTask)
      onClose()
      setTitle('')
      setDescription('')
      setPointsValue(15)
      setAssignedTo(null)
      setRecurrence('none')
      setRecurrenceTime('')
      setSelectedDays(['monday'])
    } catch (err) {
      console.error('Failed to create chore:', err)
      setErrorMsg(err.message || (isDutch ? 'Kon klusje niet aanmaken.' : 'Could not create chore. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const dayDefinitions = [
    { id: 'monday', label: isDutch ? 'Ma' : 'Mo', full: isDutch ? 'Maandag' : 'Monday' },
    { id: 'tuesday', label: isDutch ? 'Di' : 'Tu', full: isDutch ? 'Dinsdag' : 'Tuesday' },
    { id: 'wednesday', label: isDutch ? 'Wo' : 'We', full: isDutch ? 'Woensdag' : 'Wednesday' },
    { id: 'thursday', label: isDutch ? 'Do' : 'Th', full: isDutch ? 'Donderdag' : 'Thursday' },
    { id: 'friday', label: isDutch ? 'Vr' : 'Fr', full: isDutch ? 'Vrijdag' : 'Friday' },
    { id: 'saturday', label: isDutch ? 'Za' : 'Sa', full: isDutch ? 'Zaterdag' : 'Saturday' },
    { id: 'sunday', label: isDutch ? 'Zo' : 'Su', full: isDutch ? 'Zondag' : 'Sunday' },
  ]

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

          {/* Allocation: Assign task to specific Parent, Kid, or Open for anyone */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={15} />
              {t('tasks.field_assign_to')}
            </label>
            <div className="assignee-selector-grid">
              <button
                type="button"
                className={`assignee-chip ${assignedTo === null ? 'active' : ''}`}
                onClick={() => setAssignedTo(null)}
              >
                <span style={{ fontSize: '1.15rem' }}>🌟</span>
                <div className="assignee-text">
                  <strong>{t('tasks.assign_anyone')}</strong>
                  <small>{t('tasks.assign_anyone_sub')}</small>
                </div>
              </button>

              {familyMembers.map((member) => {
                const isParentRole = member.role === 'parent'
                const isSelected = assignedTo === member.id
                return (
                  <button
                    key={member.id}
                    type="button"
                    className={`assignee-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setAssignedTo(member.id)}
                  >
                    <span style={{ fontSize: '1.15rem' }}>{isParentRole ? '👑' : '🚀'}</span>
                    <div className="assignee-text">
                      <strong>{member.display_name}</strong>
                      <small>{isParentRole ? (isDutch ? 'Ouder' : 'Parent') : (isDutch ? 'Kind' : 'Kid')}</small>
                    </div>
                  </button>
                )
              })}
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
                { id: 'weekly', label: t('tasks.recurrence_weekly'), icon: '📅' },
                { id: 'daily', label: t('tasks.recurrence_daily'), icon: '☀️' },
                { id: 'monthly', label: t('tasks.recurrence_monthly'), icon: '🗓️' },
                { id: 'yearly', label: t('tasks.recurrence_yearly'), icon: '🎂' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`recurrence-choice-btn ${recurrence === item.id ? 'active' : ''}`}
                  onClick={() => handleRecurrenceChange(item.id)}
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
              <div className="form-group" style={{ marginBottom: (recurrence === 'weekly' || recurrence === 'daily') ? '0.85rem' : 0 }}>
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

              {/* Multi-Select Specific Days in a Week */}
              {(recurrence === 'weekly' || recurrence === 'daily') && (
                <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <Calendar size={14} />
                    {t('tasks.field_day_of_week')}
                  </label>

                  {/* Quick Shortcuts: Elke dag, Weekdagen, Weekend */}
                  <div className="day-shortcuts-row">
                    <button
                      type="button"
                      className={`day-shortcut-btn ${selectedDays.length === 7 ? 'active' : ''}`}
                      onClick={() => setSelectedDays(ALL_DAYS)}
                    >
                      {t('tasks.recurrence_days_shortcut_all')}
                    </button>
                    <button
                      type="button"
                      className={`day-shortcut-btn ${selectedDays.length === 5 && !selectedDays.includes('saturday') && !selectedDays.includes('sunday') ? 'active' : ''}`}
                      onClick={() => setSelectedDays(WEEKDAYS)}
                    >
                      {t('tasks.recurrence_days_shortcut_weekdays')}
                    </button>
                    <button
                      type="button"
                      className={`day-shortcut-btn ${selectedDays.length === 2 && selectedDays.includes('saturday') && selectedDays.includes('sunday') ? 'active' : ''}`}
                      onClick={() => setSelectedDays(WEEKEND)}
                    >
                      {t('tasks.recurrence_days_shortcut_weekend')}
                    </button>
                  </div>

                  {/* Individual Day Chips (Multi-Select) */}
                  <div className="weekday-selector">
                    {dayDefinitions.map((d) => {
                      const isSelected = selectedDays.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          type="button"
                          title={d.full}
                          className={`weekday-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleDay(d.id)}
                        >
                          {d.label}
                        </button>
                      )
                    })}
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
