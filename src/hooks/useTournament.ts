import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateStandings,
  defaultMatches,
  defaultPlayers,
  getCurrentRound,
  getRoundBye,
  getRoundMatches,
  mergeMatchesWithDefaults,
  mergePlayersWithDefaults,
  calculateTopScorers,
  resolveKnockoutBracket,
  type KnockoutMatch,
  type Match,
  type Player,
  type ScorerEntry,
} from '../domain/tournament'
import {
  saveKnockoutMatchScore,
  saveMatchScore,
  savePlayerProfile,
  seedTournament,
  subscribeKnockoutMatches,
  subscribeMatches,
  subscribePlayers,
  uploadPlayerPhoto,
} from '../services/tournamentRepository'
import { fetchTeamRoster } from '../services/apiFootball'

export function useTournament(userId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([])
  const [selectedRound, setSelectedRound] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [savingKnockoutMatchId, setSavingKnockoutMatchId] = useState<string | null>(null)
  const hasAutoSelectedRound = useRef(false)

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

    const unsubscribeKnockoutMatches = subscribeKnockoutMatches(
      (nextKnockoutMatches) => {
        setKnockoutMatches(nextKnockoutMatches)
      },
      (firebaseError) => {
        setError(firebaseError.message)
      },
    )

    return () => {
      unsubscribePlayers()
      unsubscribeMatches()
      unsubscribeKnockoutMatches()
    }
  }, [])

  const activePlayers = useMemo(() => mergePlayersWithDefaults(players), [players])
  const activeMatches = useMemo(() => mergeMatchesWithDefaults(matches), [matches])

  useEffect(() => {
    if (loading || hasAutoSelectedRound.current) {
      return
    }

    hasAutoSelectedRound.current = true
    setSelectedRound(getCurrentRound(activeMatches))
  }, [loading, activeMatches])

  const standings = useMemo(() => calculateStandings(activePlayers, activeMatches), [activePlayers, activeMatches])
  const topScorers = useMemo(() => calculateTopScorers(activePlayers, activeMatches), [activePlayers, activeMatches])
  const roundMatches = useMemo(() => getRoundMatches(activeMatches, selectedRound), [activeMatches, selectedRound])
  const byePlayerId = useMemo(() => getRoundBye(activeMatches, selectedRound), [activeMatches, selectedRound])
  const byePlayer = activePlayers.find((player) => player.id === byePlayerId)
  const isSeeded = players.length >= defaultPlayers.length && matches.length >= defaultMatches.length
  const knockoutBracket = useMemo(
    () => resolveKnockoutBracket(standings, knockoutMatches),
    [standings, knockoutMatches],
  )

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

  async function handleSaveKnockoutScore(matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) {
    if (!userId) {
      setError('Entre com o Google antes de salvar resultados.')
      return
    }

    if (homeGoals === awayGoals) {
      setError('O mata-mata nao pode terminar empatado. Defina um vencedor.')
      return
    }

    setSavingKnockoutMatchId(matchId)
    setError('')

    try {
      await saveKnockoutMatchScore(matchId, homeGoals, awayGoals, scorers, userId)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o placar do mata-mata.')
    } finally {
      setSavingKnockoutMatchId(null)
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

  async function handleSyncTeamRoster(teamName: string, teamId?: number) {
    return fetchTeamRoster(teamName, teamId)
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
    knockoutBracket,
    savingKnockoutMatchId,
    seedTournament: handleSeed,
    saveScore: handleSaveScore,
    saveKnockoutScore: handleSaveKnockoutScore,
    savePlayer: handleSavePlayer,
    uploadPlayerPhoto,
    syncTeamRoster: handleSyncTeamRoster,
  }
}
