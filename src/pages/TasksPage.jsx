import { useAuth } from '../context/useAuth'
import TaskList from '../components/tasks/TaskList'

export default function TasksPage() {
  const { role, user, familyId, refreshProfile } = useAuth()

  return (
    <TaskList
      role={role}
      currentUserId={user?.id}
      familyId={familyId}
      onPointsRefresh={refreshProfile}
    />
  )
}

