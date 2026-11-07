import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { useLanguage } from '../context/useLanguage'
import { THEMES } from '../context/theme-context'
import {
  getFamilyMembers,
  updateFamilyName,
  adjustMemberPoints,
  setMemberPoints,
} from '../services/familyService'
import Toast from '../components/common/Toast'
import {
  User,
  Users,
  Copy,
  Check,
  LogOut,
  Coins,
  Shield,
  KeyRound,
  Palette,
  CheckCircle2,
  Edit2,
  Globe,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import '../styles/auth.css'
import '../styles/tasks.css'

export default function SettingsPage() {
  const { user, family, familyId, role, points, displayName, signOut, updateDisplayName, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t, lang, setLanguage, isDutch } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error' })

  // Inline display name editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameVal, setEditNameVal] = useState(displayName || '')
  const [savingName, setSavingName] = useState(false)

  // Inline family name editing
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false)
  const [editFamilyNameVal, setEditFamilyNameVal] = useState(family?.name || '')
  const [savingFamilyName, setSavingFamilyName] = useState(false)

  // Parent points management
  const [adjustMember, setAdjustMember] = useState(null)
  const [adjustMode, setAdjustMode] = useState('deduct') // 'deduct' | 'add' | 'set'
  const [adjustAmount, setAdjustAmount] = useState(10)
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  const isParent = role === 'parent'

  useEffect(() => {
    let isMounted = true
    if (!familyId) return

    getFamilyMembers(familyId)
      .then((data) => {
        if (isMounted) {
          setMembers(data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load family members:', err)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingMembers(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [familyId])

  const handleCopyCode = async () => {
    if (!family?.invite_code) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!editNameVal.trim() || !updateDisplayName) return
    setSavingName(true)
    try {
      await updateDisplayName(editNameVal.trim())
      setIsEditingName(false)
      setToast({ message: t('settings.name_saved'), type: 'success' })
    } catch (err) {
      console.error('Failed to update name:', err)
      setToast({ message: isDutch ? 'Kon weergavenaam niet bijwerken.' : 'Failed to update name.', type: 'error' })
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveFamilyName = async (e) => {
    e.preventDefault()
    const clean = editFamilyNameVal.trim()
    if (!clean || !familyId) return
    setSavingFamilyName(true)
    try {
      await updateFamilyName(familyId, clean)
      if (refreshProfile) {
        await refreshProfile()
      }
      setIsEditingFamilyName(false)
      setToast({ message: t('settings.family_name_saved'), type: 'success' })
    } catch (err) {
      console.error('Failed to update family name:', err)
      setToast({ message: isDutch ? 'Kon familienaam niet bijwerken.' : 'Failed to update family name.', type: 'error' })
    } finally {
      setSavingFamilyName(false)
    }
  }

  const handleConfirmAdjustPoints = async () => {
    if (!adjustMember) return
    const num = parseInt(adjustAmount, 10)
    if (isNaN(num) || num < 0) {
      setToast({ message: isDutch ? 'Vul een geldig puntenaantal in.' : 'Please enter a valid points amount.', type: 'error' })
      return
    }

    setAdjustLoading(true)
    try {
      let updatedProfile = null
      if (adjustMode === 'set') {
        updatedProfile = await setMemberPoints(adjustMember.id, num)
      } else {
        const delta = adjustMode === 'deduct' ? -num : num
        updatedProfile = await adjustMemberPoints(adjustMember.id, delta)
      }

      const newBalance = updatedProfile?.points ?? 0

      // Update local members list immediately
      setMembers((prev) =>
        prev.map((m) => (m.id === adjustMember.id ? { ...m, points: newBalance } : m))
      )

      // If user modified their own points, refresh their header balance
      if (adjustMember.id === user?.id && refreshProfile) {
        await refreshProfile()
      }

      setToast({
        message: t('settings.points_adjusted_succ').replace('{name}', adjustMember.display_name || adjustMember.role),
        type: 'success',
      })
      setAdjustMember(null)
      setAdjustReason('')
    } catch (err) {
      console.error('Failed to adjust member points:', err)
      setToast({
        message: isDutch ? 'Kon punten niet bijwerken.' : 'Failed to adjust points.',
        type: 'error',
      })
    } finally {
      setAdjustLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'error' })}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-pure)' }}>
            {t('settings.title')}
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isDutch ? 'Pas je naam, taal en app thema aan en nodig gezinsleden uit' : 'Personalize your name, language, theme, and invite family'}
          </p>
        </div>

        <button
          onClick={signOut}
          className="signout-btn"
          style={{ padding: '0.55rem 1rem' }}
          title={t('settings.sign_out')}
        >
          <LogOut size={16} />
          <span>{t('settings.sign_out')}</span>
        </button>
      </div>

      {/* Language Card (Dutch Default + English Optional) */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--discord-green)' }}>
            <Globe size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{t('settings.language_heading')}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isDutch ? 'Kies jouw voorkeurstaal voor de applicatie' : 'Choose your preferred interface language'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setLanguage('nl')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              border: lang === 'nl' ? '2.5px solid var(--theme-accent, var(--discord-blurple))' : '1.5px solid var(--border-subtle)',
              background: lang === 'nl' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              color: 'var(--text-pure)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{t('settings.lang_dutch')}</span>
            {lang === 'nl' && <CheckCircle2 size={18} color="var(--theme-accent, var(--discord-blurple))" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              border: lang === 'en' ? '2.5px solid var(--theme-accent, var(--discord-blurple))' : '1.5px solid var(--border-subtle)',
              background: lang === 'en' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              color: 'var(--text-pure)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{t('settings.lang_english')}</span>
            {lang === 'en' && <CheckCircle2 size={18} color="var(--theme-accent, var(--discord-blurple))" />}
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(88, 101, 242, 0.15)', color: 'var(--theme-accent, var(--discord-blurple))' }}>
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{t('settings.profile_heading')}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isDutch ? 'Jouw accountgegevens en actuele punten' : 'Your account details and point balance'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.15rem' }}>
          {/* Editable Display Name */}
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('settings.display_name_label')}
            </span>
            {isEditingName ? (
              <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={editNameVal}
                  onChange={(e) => setEditNameVal(e.target.value)}
                  className="input-field"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.9rem', width: '130px' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingName}
                  style={{
                    background: 'var(--discord-green)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    color: '#090a0f',
                    cursor: 'pointer',
                  }}
                  title={t('common.save')}
                >
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-pure)', fontWeight: 700 }}>
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditNameVal(displayName || '')
                    setIsEditingName(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  title={t('settings.display_name_label')}
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              {isDutch ? 'Rol' : 'Role'}
            </span>
            <span className={`role-badge ${role || 'kid'}`}>
              <Shield size={13} />
              {isParent ? t('common.parent') : t('common.kid')}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('auth.email_label')}
            </span>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-pure)', fontWeight: 500 }}>
              {user?.email || 'N/A'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              {isDutch ? 'Huidige Punten' : 'Points Balance'}
            </span>
            <div className="points-pill" style={{ display: 'inline-flex', padding: '0.35rem 0.8rem', fontSize: '0.92rem', gap: '0.35rem' }}>
              <Coins size={16} />
              <span>{points}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Themes Selection Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--theme-accent, var(--discord-blurple))' }}>
            <Palette size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{t('settings.theme_heading')}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isDutch ? 'Kies jouw stijl: van speels en vrolijk tot strak en minimalistisch' : 'Choose your vibe from playful to sleek and mature'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {THEMES.map((themeOption) => {
            const isSelected = theme === themeOption.id || (theme === 'playful' && themeOption.id === 'candy') || (theme === 'modern' && themeOption.id === 'obsidian')
            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => setTheme(themeOption.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  borderRadius: '16px',
                  border: isSelected ? `2.5px solid ${themeOption.accentPreview}` : '1.5px solid var(--border-subtle)',
                  boxShadow: isSelected ? `0 4px 14px ${themeOption.accentPreview}33` : 'none',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: themeOption.bgPreview,
                    border: `2px solid ${themeOption.accentPreview}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: themeOption.accentPreview,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                    <strong style={{ color: 'var(--text-pure)', fontSize: '0.92rem' }}>
                      {themeOption.name}
                    </strong>
                    {isSelected && <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />}
                  </div>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {themeOption.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Family & Invite Code Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon family" style={{ background: 'rgba(254, 231, 92, 0.15)', color: 'var(--discord-yellow)' }}>
            <Users size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingFamilyName ? (
              <form onSubmit={handleSaveFamilyName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={editFamilyNameVal}
                  onChange={(e) => setEditFamilyNameVal(e.target.value)}
                  className="input-field"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.95rem', width: '200px' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingFamilyName}
                  style={{
                    background: 'var(--discord-green)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    color: '#090a0f',
                    cursor: 'pointer',
                  }}
                  title={t('common.save')}
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingFamilyName(false)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                  title={t('common.cancel')}
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-pure)' }}>
                  {family?.name || t('nav.family_nest')}
                </h2>
                {isParent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditFamilyNameVal(family?.name || '')
                      setIsEditingFamilyName(true)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title={t('settings.edit_family_name')}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {family?.invite_code ? (
          <div
            className="dashed-empty-container"
            style={{
              padding: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.2rem',
              borderRadius: '16px',
            }}
          >
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--theme-accent, var(--discord-blurple))', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                <KeyRound size={14} /> {t('settings.invite_code_label')}
              </span>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: 'var(--text-pure)',
                  fontFamily: 'monospace',
                }}
              >
                {family.invite_code}
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('settings.invite_code_desc')}
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              type="button"
              className="auth-submit-btn action-btn-primary"
              style={{
                width: 'auto',
                margin: 0,
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                background: copied ? 'var(--discord-green)' : 'var(--theme-accent, var(--discord-blurple))',
                color: '#ffffff',
              }}
            >
              {copied ? (
                <>
                  <Check size={16} /> {t('settings.code_copied')}
                </>
              ) : (
                <>
                  <Copy size={16} /> {t('settings.copy_code')}
                </>
              )}
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
            {isDutch ? 'Nog geen gezin gekoppeld.' : 'No family linked yet.'}
          </p>
        )}

        {/* Connected Family Members */}
        {familyId && (
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-pure)' }}>
              {t('settings.members_heading')} ({members.length})
            </h3>

            {loadingMembers ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('common.loading')}</p>
            ) : members.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t('settings.no_members')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`role-badge ${m.role}`}>
                        {m.role === 'parent' ? t('common.parent') : t('common.kid')}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-pure)', fontWeight: 700 }}>
                        {m.display_name || (m.role === 'parent' ? t('common.parent') : t('common.kid'))}
                        {m.id === user?.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--theme-accent, var(--discord-blurple))', marginLeft: '0.4rem' }}>
                            ({isDutch ? 'Jij' : 'You'})
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--discord-yellow)', fontWeight: 800, fontSize: '0.92rem' }}>
                        <Coins size={16} />
                        <span>{m.points}</span>
                      </div>

                      {isParent && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustMember(m)
                            setAdjustMode('deduct')
                            setAdjustAmount(10)
                            setAdjustReason('')
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-pure)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title={t('settings.manage_points')}
                        >
                          <SlidersHorizontal size={13} />
                          <span>{isDutch ? 'Punten Beheren' : 'Manage Points'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parent Manage Points Modal */}
      {adjustMember && (
        <div className="modal-backdrop" onClick={() => !adjustLoading && setAdjustMember(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '440px', width: '92%', background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                {t('settings.adjust_points_title')} {adjustMember.display_name || (adjustMember.role === 'parent' ? t('common.parent') : t('common.kid'))}
              </h3>
              <button
                type="button"
                onClick={() => !adjustLoading && setAdjustMember(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {isDutch ? 'Huidig saldo:' : 'Current balance:'}{' '}
                <strong style={{ color: 'var(--discord-yellow)' }}>{adjustMember.points} {t('common.points')}</strong>
              </div>

              {/* Mode Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.15rem' }}>
                <button
                  type="button"
                  onClick={() => setAdjustMode('deduct')}
                  style={{
                    padding: '0.55rem 0.4rem',
                    borderRadius: '10px',
                    border: adjustMode === 'deduct' ? '2px solid var(--discord-red)' : '1px solid var(--border-subtle)',
                    background: adjustMode === 'deduct' ? 'rgba(248, 113, 113, 0.15)' : 'var(--bg-surface)',
                    color: adjustMode === 'deduct' ? 'var(--discord-red)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('settings.points_operation_deduct')}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('add')}
                  style={{
                    padding: '0.55rem 0.4rem',
                    borderRadius: '10px',
                    border: adjustMode === 'add' ? '2px solid var(--discord-green)' : '1px solid var(--border-subtle)',
                    background: adjustMode === 'add' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-surface)',
                    color: adjustMode === 'add' ? 'var(--discord-green)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('settings.points_operation_add')}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('set')}
                  style={{
                    padding: '0.55rem 0.4rem',
                    borderRadius: '10px',
                    border: adjustMode === 'set' ? '2px solid var(--theme-accent, var(--discord-blurple))' : '1px solid var(--border-subtle)',
                    background: adjustMode === 'set' ? 'var(--theme-accent-glow, rgba(99, 102, 241, 0.15))' : 'var(--bg-surface)',
                    color: adjustMode === 'set' ? 'var(--theme-accent, var(--discord-blurple))' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('settings.points_operation_set')}
                </button>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  {adjustMode === 'set' ? (isDutch ? 'Nieuw saldo in punten' : 'New point balance') : (isDutch ? 'Aantal punten' : 'Number of points')}
                </label>
                <div className="points-input-group" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    className="input-field modal-input points-number-input"
                    value={adjustAmount}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        setAdjustAmount('')
                      } else {
                        const num = parseInt(raw, 10)
                        if (!isNaN(num)) setAdjustAmount(Math.max(0, num))
                      }
                    }}
                    onBlur={() => {
                      if (adjustAmount === '' || isNaN(Number(adjustAmount))) {
                        setAdjustAmount(adjustMode === 'set' ? 0 : 10)
                      }
                    }}
                    style={{ width: '100px' }}
                  />

                  <div className="quick-points-pills" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {[5, 10, 20, 50, 100].map((pillVal) => (
                      <button
                        key={pillVal}
                        type="button"
                        className="quick-point-btn"
                        onClick={() => setAdjustAmount(pillVal)}
                        style={{
                          background: adjustAmount === pillVal ? 'var(--bg-surface-hover)' : 'var(--bg-surface-elevated)',
                          fontWeight: 700,
                        }}
                      >
                        {adjustMode === 'deduct' ? `-${pillVal}` : `+${pillVal}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Note */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  {t('settings.points_reason_label')}
                </label>
                <input
                  type="text"
                  className="input-field modal-input"
                  placeholder={t('settings.points_reason_placeholder')}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setAdjustMember(null)}
                  disabled={adjustLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjustPoints}
                  disabled={adjustLoading}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    background:
                      adjustMode === 'deduct'
                        ? 'var(--discord-red)'
                        : adjustMode === 'add'
                        ? 'var(--discord-green)'
                        : 'var(--theme-accent, var(--discord-blurple))',
                    color: '#ffffff',
                  }}
                >
                  {adjustLoading
                    ? t('common.loading')
                    : adjustMode === 'deduct'
                    ? `${adjustAmount || 0} ${isDutch ? 'Punten Aftrekken' : 'Points Deduct'}`
                    : adjustMode === 'add'
                    ? `${adjustAmount || 0} ${isDutch ? 'Punten Toevoegen' : 'Points Add'}`
                    : `${isDutch ? 'Opslaan als' : 'Set to'} ${adjustAmount || 0} pts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <div style={{ textAlign: 'center', padding: '0.75rem 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p style={{ margin: 0 }}>
          {isDutch ? 'Gezinstaken & Beloningen Hub' : 'Family Chore & Reward Hub'}
        </p>
      </div>
    </div>
  )
}
