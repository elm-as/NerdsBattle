import { useSearchParams } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import SoloMatchmaking from '../components/matchmaking/SoloMatchmaking.jsx'
import PvpMatchmaking from '../components/matchmaking/PvpMatchmaking.jsx'

export default function Matchmaking() {
  const [params] = useSearchParams()
  const { user } = useUser()

  const mode = params.get('mode') || '1v1'
  const subjectId = params.get('subject') || user?.subjects?.[0] || 'maths'
  const levelId = params.get('level') || user?.levelId || 'seconde'
  const ranked = params.get('ranked') !== '0'
  const topic = params.get('topic') || ''

  const isBattle = mode === '1v1' || mode === '2v2'

  if (isBattle) {
    return (
      <PvpMatchmaking
        mode={mode}
        subjectId={subjectId}
        levelId={levelId}
        topic={topic}
        ranked={ranked}
      />
    )
  }

  return (
    <SoloMatchmaking
      mode={mode}
      subjectId={subjectId}
      levelId={levelId}
      topic={topic}
      ranked={ranked}
    />
  )
}
