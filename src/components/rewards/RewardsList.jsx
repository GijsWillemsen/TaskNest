import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Gift,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import RewardCard from './RewardCard'
import RewardRequestCard from './RewardRequestCard'
import CreateRewardModal from './CreateRewardModal'
import { getRewards, getRewardRequests } from '../../services/rewardService'
import '../../styles/rewards.css'

export default function RewardsList({ role, kidId, points, onPointsRefresh }) {
  const [rewards, setRewards] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('store') // 'store', 'pending_requests', 'my_items'
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isParent = role === 'parent'

  // Fetch rewards catalog and requests
  const loadData = useCallback(async () => {
    try {
      const [rewardsData, requestsData] = await Promise.all([
        getRewards(),
        getRewardRequests(),
      ])
      setRewards(rewardsData)
      setRequests(requestsData)
    } catch (err) {
      console.error('Failed to load rewards data:', err)
      setErrorMessage(err.message || 'Unable to load rewards.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const [rewardsData, requestsData] = await Promise.all([
          getRewards(),
          getRewardRequests(),
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
  }, [])

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
    setSuccessMessage(`Reward "${newReward.title}" added to the store!`)
  }

  const handleRewardDeleted = (deletedId) => {
    setRewards((prev) => prev.filter((r) => r.id !== deletedId))
  }

  // Request actions
  const handleRewardRequested = (newRequest) => {
    // Attach reward details to the request for immediate rendering
    const matchedReward = rewards.find((r) => r.id === newRequest.reward_id)
    const enriched = {
      ...newRequest,
      rewards: matchedReward || null,
    }
    setRequests((prev) => [enriched, ...prev])
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

  // Filtered requests for Parent (Pending) or Kid (My Items)
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'pending')
  }, [requests])

  const myKidItems = useMemo(() => {
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
          <h2>Rewards Store</h2>
          <span className="count-badge">{rewards.length} items</span>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={handleManualRefresh}
            className="icon-btn"
            title="Refresh rewards"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>

          {isParent && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-create-chore"
              style={{ background: 'var(--discord-orange)' }}
              title="Add a new reward to the store"
            >
              <Plus size={18} />
              <span>Create Reward</span>
            </button>
          )}
        </div>
      </div>

      {/* Parent Highlight: Pending Purchase Requests */}
      {isParent && pendingRequests.length > 0 && activeTab === 'store' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--discord-yellow)', fontWeight: 700, fontSize: '0.95rem' }}>
              ⚡ Pending Purchase Requests ({pendingRequests.length})
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
            Storefront
          </button>

          {isParent && (
            <button
              className={`filter-tab ${activeTab === 'pending_requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending_requests')}
            >
              <Clock size={14} />
              Purchase Requests
              {pendingRequests.length > 0 && (
                <span className="tab-bubble">{pendingRequests.length}</span>
              )}
            </button>
          )}

          {!isParent && (
            <button
              className={`filter-tab ${activeTab === 'my_items' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_items')}
            >
              <Sparkles size={14} />
              My Items ({myKidItems.length})
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
              placeholder="Search rewards..."
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
            <p>Loading rewards catalog...</p>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap" style={{ color: 'var(--discord-orange)' }}>
              <Gift size={30} />
            </div>
            <h3>No rewards found</h3>
            <p>
              {isParent
                ? 'Click "Create Reward" above to add items like game time, treats, or outings!'
                : 'Ask a parent to stock the rewards store!'}
            </p>
            {isParent && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-create-chore mt-2"
                style={{ background: 'var(--discord-orange)' }}
              >
                <Plus size={18} />
                <span>Add First Reward</span>
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
                onRewardDeleted={handleRewardDeleted}
                onRewardRequested={handleRewardRequested}
                onError={setErrorMessage}
                onSuccess={setSuccessMessage}
              />
            ))}
          </div>
        )
      )}

      {/* Tab 2: Parent Purchase Requests */}
      {activeTab === 'pending_requests' && isParent && (
        requests.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap">
              <Clock size={30} />
            </div>
            <h3>No purchase requests</h3>
            <p>When kids request to buy a reward with points, their requests will appear here for approval.</p>
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

      {/* Tab 3: Kid's My Items */}
      {activeTab === 'my_items' && !isParent && (
        myKidItems.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap" style={{ color: 'var(--discord-yellow)' }}>
              <Sparkles size={30} />
            </div>
            <h3>No requested rewards yet</h3>
            <p>Visit the Storefront to redeem your chore points for fun privileges and rewards!</p>
          </div>
        ) : (
          <div className="rewards-grid">
            {myKidItems.map((req) => (
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
      />
    </div>
  )
}
