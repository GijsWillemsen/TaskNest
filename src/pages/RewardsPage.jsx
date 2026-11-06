import { useAuth } from '../context/useAuth'
import RewardsList from '../components/rewards/RewardsList'

export default function RewardsPage() {
  const { role, user, familyId, points, refreshProfile } = useAuth()

  return (
    <RewardsList
      role={role}
      kidId={user?.id}
      familyId={familyId}
      points={points}
      onPointsRefresh={refreshProfile}
    />
  )
}

