import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import { getTasks } from '../../services/taskService'
import { getFamilyMembers } from '../../services/familyService'
import { supabase } from '../../supabaseClient'
import { useLanguage } from '../../context/useLanguage'
import '../../styles/tasks.css'

export default function TaskList({ role, currentUserId, familyId, onPointsRefresh }) {
  const { t } = useLanguage()
  const [tasks, setTasks] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open') // Standard default tab is now 'open'
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isParent = role === 'parent'

  // Initial load
  useEffect(() => {
    let isMounted = true

    const loadTasks = async () => {
      try {
        const [tasksData, membersData] = await Promise.all([
          getTasks(familyId),
          getFamilyMembers(familyId),
        ])
        if (isMounted) {
          setTasks(tasksData)
          setFamilyMembers(membersData)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load tasks:', err)
          setErrorMessage(err.message || 'Unable to fetch chores from database.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTasks()

    // Realtime subscription for live family updates
    const channel = supabase
      .channel('tasks-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadTasks()
          if (onPointsRefresh) onPointsRefresh()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [onPointsRefresh, familyId])

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTasks(familyId)
      setTasks(data)
    } catch (err) {
      console.error('Failed to refresh tasks:', err)
      setErrorMessage(err.message || 'Unable to fetch chores from database.')
    } finally {
      setLoading(false)
    }
  }, [familyId])

  // Clear notifications after 5 seconds
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

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev])
    setSuccessMessage(`Chore "${newTask.title}" added to the family list!`)
  }

  const handleTaskUpdated = (updatedResult) => {
    const taskObj = updatedResult?.updatedTask || updatedResult
    setTasks((prev) => {
      let list = prev.map((t) => (t.id === taskObj.id ? { ...t, ...taskObj } : t))
      if (updatedResult?.nextTask && !list.some((t) => t.id === updatedResult.nextTask.id)) {
        list = [updatedResult.nextTask, ...list]
      }
      return list
    })
    if (onPointsRefresh) {
      onPointsRefresh()
    }
  }

  const handleTaskDeleted = (deletedId) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedId))
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Role-specific pool eligibility for kids
      if (!isParent && task.eligible_assignees && Array.isArray(task.eligible_assignees) && task.eligible_assignees.length > 0) {
        if (!task.eligible_assignees.includes(currentUserId) && task.claimed_by !== currentUserId) {
          return false
        }
      }

      // Role-specific and tab filtering
      if (filter === 'open' && task.status !== 'open') return false
      if (filter === 'my_tasks' && (task.claimed_by !== currentUserId || task.status === 'completed')) return false
      if (filter === 'needs_approval' && task.status !== 'pending_approval') return false
      if (filter === 'completed' && task.status !== 'completed') return false

      // Search query filtering
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDesc = task.description?.toLowerCase().includes(query)
        return matchesTitle || matchesDesc
      }

      return true
    })
  }, [tasks, filter, searchQuery, currentUserId, isParent])

  // Summary counts
  const pendingApprovalCount = tasks.filter((t) => t.status === 'pending_approval').length
  const myActiveCount = tasks.filter(
    (t) => t.claimed_by === currentUserId && t.status === 'claimed'
  ).length
  const openCount = tasks.filter((t) => {
    if (t.status !== 'open') return false
    if (!isParent && t.eligible_assignees && Array.isArray(t.eligible_assignees) && t.eligible_assignees.length > 0) {
      return t.eligible_assignees.includes(currentUserId)
    }
    return true
  }).length

  return (
    <div className="task-section">
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

      {/* Top Toolbar */}
      <div className="section-toolbar">
        <div className="toolbar-left">
          <h2>{t('tasks.title')}</h2>
          <span className="count-badge">{t('tasks.items_count', { count: tasks.length })}</span>
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
              title={t('tasks.add_chore')}
            >
              <Plus size={18} />
              <span>{t('tasks.add_chore')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="filter-tabs-row">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            <Sparkles size={13} />
            {t('tasks.tab_open')} ({openCount})
          </button>

          <button
            className={`filter-tab ${filter === 'my_tasks' ? 'active' : ''}`}
            onClick={() => setFilter('my_tasks')}
          >
            <Clock size={13} />
            {t('tasks.tab_my_tasks')} ({myActiveCount})
          </button>

          {isParent && (
            <button
              className={`filter-tab ${filter === 'needs_approval' ? 'active' : ''}`}
              onClick={() => setFilter('needs_approval')}
            >
              {t('tasks.tab_needs_approval')}
              {pendingApprovalCount > 0 && (
                <span className="tab-bubble">{pendingApprovalCount}</span>
              )}
            </button>
          )}

          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            {t('tasks.tab_completed')}
          </button>

          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('tasks.tab_all')}
          </button>
        </div>

        {/* Search */}
        <div className="search-bar-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('tasks.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks List Content */}
      {loading ? (
        <div className="section-loading">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon-wrap">
            <CheckSquare size={30} />
          </div>
          <h3>{t('tasks.empty_title')}</h3>
          <p>
            {filter === 'needs_approval'
              ? t('tasks.empty_desc_approval')
              : filter === 'open'
              ? t('tasks.empty_desc_open')
              : filter === 'my_tasks'
              ? t('tasks.empty_desc_my')
              : filter === 'completed'
              ? t('tasks.empty_desc_completed')
              : isParent
              ? t('tasks.empty_parent_prompt')
              : t('tasks.empty_desc_open')}
          </p>
          {isParent && (
            <button onClick={() => setIsModalOpen(true)} className="btn-create-chore mt-2">
              <Plus size={18} />
              <span>{t('tasks.add_first_chore')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isParent={isParent}
              currentUserId={currentUserId}
              familyMembers={familyMembers}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              onError={setErrorMessage}
              onSuccess={setSuccessMessage}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal for Parent */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        familyId={familyId}
        familyMembers={familyMembers}
      />
    </div>
  )
}
