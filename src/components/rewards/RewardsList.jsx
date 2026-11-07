import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Gift,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Ticket,
  ShoppingBag,
} from 'lucide-react'
import RewardCard from './RewardCard'
import RewardRequestCard from './RewardRequestCard'
import CreateRewardModal from './CreateRewardModal'
import { getRewards, getRewardRequests } from '../../services/rewardService'
import { useLanguage } from '../../context/useLanguage'
import '../../styles/rewards.css'

export default function RewardsList({ role, kidId, familyId, points, onPointsRefresh }) {
  const { t, isDutch } = useLanguage()
  const [rewards, setRewards] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('store') // 'store', 'pending_requests', 'my_tickets'
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isParent = role === 'parent'

  // Fetch rewards catalog and requests
  const loadData = useCallback(async () => {
    try {
      const [rewardsData, requestsData] = await Promise.all([
        getRewards(familyId),
        getRewardRequests(familyId),
      ])
      setRewards(rewardsData)
      setRequests(requestsData)
    } catch (err) {
      console.error('Failed to load rewards data:', err)
      setErrorMessage(err.message || 'Unable to load rewards.')
    } finally {
      setLoading(false)
    }
  }, [familyId])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const [rewardsData, requestsData] = await Promise.all([
          getRewards(familyId),
          getRewardRequests(familyId),
        ])
        if (isMounted) {
          setRewards(rewardsData)
          setRequests(requestsData)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Init load error:', err)
          setErrorMessage(err.message || 'Could not load rewards.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [familyId])

  const handleManualRefresh = useCallback(async () => {
    setLoading(true)
    await loadData()
    if (onPointsRefresh) {
      onPointsRefresh()
    }
  }, [loadData, onPointsRefresh])

  // Auto-dismiss alerts
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 6000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Reward catalog actions
  const handleRewardCreated = (newReward) => {
    setRewards((prev) => [...prev, newReward])
    setSuccessMessage(isDutch ? `Beloning "${newReward.title}" toegevoegd!` : `Reward "${newReward.title}" added to the store!`)
  }

  const handleRewardDeleted = (deletedId) => {
    setRewards((prev) => prev.filter((r) => r.id !== deletedId))
  }

  // Request & ticket actions
  const handleRewardRequested = (newRequest) => {
    // Attach reward details to the request for immediate rendering
    const matchedReward = rewards.find((r) => r.id === newRequest.reward_id)
    const enriched = {
      ...newRequest,
      rewards: newRequest.rewards || matchedReward || null,
    }
    setRequests((prev) => [enriched, ...prev.filter((r) => r.id !== enriched.id)])
    if (onPointsRefresh) {
      onPointsRefresh()
    }
  }

  const handleRequestUpdated = (updatedRequest) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === updatedRequest.id
          ? { ...r, ...updatedRequest }
          : r
      )
    )
    if (onPointsRefresh) {
      onPointsRefresh()
    }
  }

  // Filtered rewards for Storefront
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = r.title.toLowerCase().includes(q)
        const matchesDesc = r.description?.toLowerCase().includes(q)
        return matchesTitle || matchesDesc
      }
      return true
    })
  }, [rewards, searchQuery])

  // Filtered requests for Parent (Pending) or Kid (My Tickets)
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'pending')
  }, [requests])

  const myKidTickets = useMemo(() => {
    return requests.filter((r) => r.kid_id === kidId)
  }, [requests, kidId])

  return (
    <div className="rewards-section">
      {/* Dynamic Alerts */}
      {errorMessage && (
        <div className="auth-alert auth-alert-error" role="alert">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-alert auth-alert-success" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="section-toolbar">
        <div className="toolbar-left">
          <h2>{t('rewards.title')}</h2>
          <span className="count-badge">{t('rewards.items_count', { count: rewards.length })}</span>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={handleManualRefresh}
            className="icon-btn"
            title={t('common.refresh')}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>

          {isParent && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-create-chore"
              style={{ background: 'var(--discord-orange)' }}
              title={t('rewards.create_reward')}
            >
              <Plus size={18} />
              <span>{t('rewards.create_reward')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Parent Highlight: Pending Ticket Usage Requests */}
      {isParent && pendingRequests.length > 0 && activeTab === 'store' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--discord-yellow)', fontWeight: 700, fontSize: '0.95rem' }}>
              {t('rewards.pending_requests_title')} ({pendingRequests.length})
            </span>
          </div>
          <div className="rewards-grid">
            {pendingRequests.map((req) => (
              <RewardRequestCard
                key={req.id}
                request={req}
                isParent={isParent}
                onRequestUpdated={handleRequestUpdated}
                onError={setErrorMessage}
                onSuccess={setSuccessMessage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="filter-tabs-row">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <ShoppingBag size={14} />
            {t('rewards.tab_store')}
          </button>

          {!isParent && (
            <button
              className={`filter-tab ${activeTab === 'my_tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_tickets')}
            >
              <Ticket size={14} />
              {t('rewards.tab_my_tickets')} ({myKidTickets.length})
            </button>
          )}

          {isParent && (
            <button
              className={`filter-tab ${activeTab === 'pending_requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending_requests')}
            >
              <Clock size={14} />
              {t('rewards.tab_requests')}
              {pendingRequests.length > 0 && (
                <span className="tab-bubble">{pendingRequests.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Search */}
        {activeTab === 'store' && (
          <div className="search-bar-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t('rewards.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tab 1: Storefront (Catalog) */}
      {activeTab === 'store' && (
        loading ? (
          <div className="section-loading">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap" style={{ color: 'var(--discord-orange)' }}>
              <Gift size={30} />
            </div>
            <h3>{t('rewards.store_empty_title')}</h3>
            <p>
              {isParent
                ? t('rewards.store_empty_desc_parent')
                : t('rewards.store_empty_desc_kid')}
            </p>
            {isParent && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-create-chore mt-2"
                style={{ background: 'var(--discord-orange)' }}
              >
                <Plus size={18} />
                <span>{t('rewards.add_first_reward')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="rewards-grid">
            {filteredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                isParent={isParent}
                kidId={kidId}
                kidPoints={points}
                familyId={familyId}
                onRewardDeleted={handleRewardDeleted}
                onRewardRequested={handleRewardRequested}
                onError={setErrorMessage}
                onSuccess={setSuccessMessage}
              />
            ))}
          </div>
        )
      )}

      {/* Tab 2: Kid's My Tickets Inventory */}
      {activeTab === 'my_tickets' && !isParent && (
        myKidTickets.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap" style={{ color: 'var(--discord-yellow)' }}>
              <Ticket size={30} />
            </div>
            <h3>{t('rewards.inventory_empty_title')}</h3>
            <p>{t('rewards.inventory_empty_desc')}</p>
          </div>
        ) : (
          <div className="rewards-grid">
            {myKidTickets.map((ticket) => (
              <RewardRequestCard
                key={ticket.id}
                request={ticket}
                isParent={isParent}
                onRequestUpdated={handleRequestUpdated}
                onError={setErrorMessage}
                onSuccess={setSuccessMessage}
              />
            ))}
          </div>
        )
      )}

      {/* Tab 3: Parent Pending Ticket Requests */}
      {activeTab === 'pending_requests' && isParent && (
        requests.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap">
              <Clock size={30} />
            </div>
            <h3>{isDutch ? 'Geen verzoeken' : 'No requests'}</h3>
            <p>{isDutch ? 'Wanneer kinderen hun kaartjes inzetten, verschijnen ze hier voor goedkeuring.' : 'When kids choose to use a reward ticket, their requests will appear here for approval.'}</p>
          </div>
        ) : (
          <div className="rewards-grid">
            {requests.map((req) => (
              <RewardRequestCard
                key={req.id}
                request={req}
                isParent={isParent}
                onRequestUpdated={handleRequestUpdated}
                onError={setErrorMessage}
                onSuccess={setSuccessMessage}
              />
            ))}
          </div>
        )
      )}

      {/* Parent Create Reward Modal */}
      <CreateRewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRewardCreated={handleRewardCreated}
        familyId={familyId}
      />
    </div>
  )
}
