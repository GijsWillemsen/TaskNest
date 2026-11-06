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
import { supabase } from '../../supabaseClient'
import '../../styles/tasks.css'

export default function TaskList({ role, currentUserId, onPointsRefresh }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'open', 'my_tasks', 'needs_approval', 'completed'
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
        const data = await getTasks()
        if (isMounted) setTasks(data)
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
  }, [onPointsRefresh])

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      console.error('Failed to refresh tasks:', err)
      setErrorMessage(err.message || 'Unable to fetch chores from database.')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    )
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
  }, [tasks, filter, searchQuery, currentUserId])

  // Summary counts
  const pendingApprovalCount = tasks.filter((t) => t.status === 'pending_approval').length
  const myActiveCount = tasks.filter(
    (t) => t.claimed_by === currentUserId && t.status === 'claimed'
  ).length
  const openCount = tasks.filter((t) => t.status === 'open').length

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
          <h2>Family Chores</h2>
          <span className="count-badge">{tasks.length} total</span>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={handleManualRefresh}
            className="icon-btn"
            title="Refresh chores"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>

          {isParent && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-create-chore"
              title="Create a new task"
            >
              <Plus size={18} />
              <span>Create Chore</span>
            </button>
          )}
        </div>
      </div>

      {/* Highlight Section: Needs Approval (Parents) */}
      {isParent && pendingApprovalCount > 0 && filter === 'all' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--discord-yellow)', fontWeight: 700, fontSize: '0.95rem' }}>
              ⚡ Needs Parent Approval ({pendingApprovalCount})
            </span>
          </div>
          <div className="tasks-grid">
            {tasks
              .filter((t) => t.status === 'pending_approval')
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isParent={isParent}
                  currentUserId={currentUserId}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                  onError={setErrorMessage}
                  onSuccess={setSuccessMessage}
                />
              ))}
          </div>
        </div>
      )}

      {/* Highlight Section: My Active Chores (Kids) */}
      {!isParent && myActiveCount > 0 && filter === 'all' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--discord-orange)', fontWeight: 700, fontSize: '0.95rem' }}>
              🚀 My Active Chores ({myActiveCount})
            </span>
          </div>
          <div className="tasks-grid">
            {tasks
              .filter((t) => t.claimed_by === currentUserId && t.status === 'claimed')
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isParent={isParent}
                  currentUserId={currentUserId}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                  onError={setErrorMessage}
                  onSuccess={setSuccessMessage}
                />
              ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="filter-tabs-row">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            <Sparkles size={13} />
            Open ({openCount})
          </button>

          {!isParent && (
            <button
              className={`filter-tab ${filter === 'my_tasks' ? 'active' : ''}`}
              onClick={() => setFilter('my_tasks')}
            >
              <Clock size={13} />
              My Chores ({myActiveCount})
            </button>
          )}

          <button
            className={`filter-tab ${filter === 'needs_approval' ? 'active' : ''}`}
            onClick={() => setFilter('needs_approval')}
          >
            Needs Approval
            {pendingApprovalCount > 0 && (
              <span className="tab-bubble">{pendingApprovalCount}</span>
            )}
          </button>

          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {/* Search */}
        <div className="search-bar-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search chores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks List Content */}
      {loading ? (
        <div className="section-loading">
          <div className="spinner"></div>
          <p>Loading chores...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon-wrap">
            <CheckSquare size={30} />
          </div>
          <h3>No chores in this view</h3>
          <p>
            {filter === 'needs_approval'
              ? 'No chores are waiting for parent review right now.'
              : filter === 'open'
              ? 'All chores are currently claimed or completed!'
              : filter === 'my_tasks'
              ? "You haven't claimed any open chores yet. Check the Open tab to get started!"
              : isParent
              ? 'Click "Create Chore" above to add the first family task!'
              : 'Ask a parent to post some chores!'}
          </p>
          {isParent && filter === 'all' && (
            <button onClick={() => setIsModalOpen(true)} className="btn-create-chore mt-2">
              <Plus size={18} />
              <span>Create First Chore</span>
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
      />
    </div>
  )
}
