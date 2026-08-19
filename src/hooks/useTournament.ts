import { useEffect, useMemo, useState } from 'react'
import {
  calculateStandings,
  defaultMatches,
  defaultPlayers,
  getRoundBye,
  getRoundMatches,
  mergeMatchesWithDefaults,
  mergePlayersWithDefaults,
  calculateTopScorers,
  type Match,
  type Player,
  type ScorerEntry,
} from '../domain/tournament'
import {
  saveMatchScore,
  savePlayerProfile,
  seedTournament,
  subscribeMatches,
  subscribePlayers,
  uploadPlayerPhoto,
} from '../services/tournamentRepository'

export function useTournament(userId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedRound, setSelectedRound] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribePlayers = subscribePlayers(
      (nextPlayers) => {
        setPlayers(nextPlayers)
        setLoading(false)
      },
      (firebaseError) => {
        setError(firebaseError.message)
        setLoading(false)
      },
    )

    const unsubscribeMatches = subscribeMatches(
      (nextMatches) => {
        setMatches(nextMatches)
        setLoading(false)
      },
      (firebaseError) => {
        setError(firebaseError.message)
        setLoading(false)
      },
    )

    return () => {
      unsubscribePlayers()
      unsubscribeMatches()
    }
  }, [])

  const activePlayers = useMemo(() => mergePlayersWithDefaults(players), [players])
  const activeMatches = useMemo(() => mergeMatchesWithDefaults(matches), [matches])

  const standings = useMemo(() => calculateStandings(activePlayers, activeMatches), [activePlayers, activeMatches])
  const topScorers = useMemo(() => calculateTopScorers(activePlayers, activeMatches), [activePlayers, activeMatches])
  const roundMatches = useMemo(() => getRoundMatches(activeMatches, selectedRound), [activeMatches, selectedRound])
  const byePlayerId = useMemo(() => getRoundBye(activeMatches, selectedRound), [activeMatches, selectedRound])
  const byePlayer = activePlayers.find((player) => player.id === byePlayerId)
  const isSeeded = players.length >= defaultPlayers.length && matches.length >= defaultMatches.length

  async function handleSeed() {
    setError('')

    try {
      await seedTournament()
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : 'Nao foi possivel criar a tabela base.')
    }
  }

  async function handleSaveScore(matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) {
    if (!userId) {
      setError('Entre com o Google antes de salvar resultados.')
      return
    }

    setSavingMatchId(matchId)
    setError('')

    try {
      await saveMatchScore(matchId, homeGoals, awayGoals, scorers, userId)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o placar.')
    } finally {
      setSavingMatchId(null)
    }
  }

  async function handleSavePlayer(player: Player) {
    if (!userId) {
      setError('Entre com o Google antes de salvar times.')
      return
    }

    setError('')
    await savePlayerProfile(player, userId)
  }

  return {
    players: activePlayers,
    standings,
    topScorers,
    matches: activeMatches,
    roundMatches,
    byePlayer,
    selectedRound,
    setSelectedRound,
    loading,
    error,
    isSeeded,
    savingMatchId,
    seedTournament: handleSeed,
    saveScore: handleSaveScore,
    savePlayer: handleSavePlayer,
    uploadPlayerPhoto,
  }
}
