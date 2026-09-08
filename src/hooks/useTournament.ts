import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateStandings,
  calculateTopScorers,
  getCurrentRound,
  getRoundBye,
  getRoundMatches,
  mergeKnockoutMatchesWithDefaults,
  resolveKnockoutBracket,
  type KnockoutMatch,
  type Match,
  type Player,
  type ScorerEntry,
  type Season,
} from '../domain/tournament'
import {
  saveSeasonKnockoutMatchScore,
  saveSeasonMatchScore,
  saveSeasonPlayerProfile,
  subscribeSeasonKnockoutMatches,
  subscribeSeasonMatches,
  subscribeSeasonPlayers,
  uploadSeasonPlayerPhoto,
} from '../services/tournamentRepository'
import { fetchTeamRoster } from '../services/apiFootball'

export function useTournament(userId: string | undefined, season: Season | undefined) {
  const seasonId = season?.id
  const totalRounds = season?.rounds ?? 1

  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([])
  const [selectedRound, setSelectedRound] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [savingKnockoutMatchId, setSavingKnockoutMatchId] = useState<string | null>(null)
  const hasAutoSelectedRound = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!seasonId) {
      setPlayers([])
      setMatches([])
      setKnockoutMatches([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribePlayers = subscribeSeasonPlayers(
      seasonId,
      (nextPlayers) => {
        setPlayers(nextPlayers)
        setLoading(false)
      },
      (firebaseError) => {
        setError(firebaseError.message)
        setLoading(false)
      },
    )

    const unsubscribeMatches = subscribeSeasonMatches(
      seasonId,
      (nextMatches) => {
        setMatches(nextMatches)
        setLoading(false)
      },
      (firebaseError) => {
        setError(firebaseError.message)
        setLoading(false)
      },
    )

    const unsubscribeKnockoutMatches = subscribeSeasonKnockoutMatches(
      seasonId,
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
  }, [seasonId])

  useEffect(() => {
    if (loading || matches.length === 0 || hasAutoSelectedRound.current === seasonId) {
      return
    }

    hasAutoSelectedRound.current = seasonId
    setSelectedRound(getCurrentRound(matches, totalRounds))
  }, [loading, matches, seasonId, totalRounds])

  const standings = useMemo(() => calculateStandings(players, matches), [players, matches])
  const activeKnockoutMatches = useMemo(() => mergeKnockoutMatchesWithDefaults(knockoutMatches), [knockoutMatches])
  const topScorers = useMemo(
    // Gols do mata-mata tambem contam na artilharia, entao juntamos as partidas
    // da fase de liga com as do mata-mata antes de somar os artilheiros.
    () => calculateTopScorers(players, [...matches, ...activeKnockoutMatches]),
    [players, matches, activeKnockoutMatches],
  )
  const roundMatches = useMemo(() => getRoundMatches(matches, selectedRound), [matches, selectedRound])
  const byePlayerId = useMemo(() => getRoundBye(matches, selectedRound), [matches, selectedRound])
  const byePlayer = players.find((player) => player.id === byePlayerId)
  const knockoutBracket = useMemo(
    () => resolveKnockoutBracket(standings, knockoutMatches),
    [standings, knockoutMatches],
  )

  async function handleSaveScore(matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) {
    if (!userId) {
      setError('Entre com o Google antes de salvar resultados.')
      return
    }

    if (!seasonId) {
      setError('Nenhuma temporada selecionada.')
      return
    }

    setSavingMatchId(matchId)
    setError('')

    try {
      await saveSeasonMatchScore(seasonId, matchId, homeGoals, awayGoals, scorers, userId)
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

    if (!seasonId) {
      setError('Nenhuma temporada selecionada.')
      return
    }

    if (homeGoals === awayGoals) {
      setError('O mata-mata nao pode terminar empatado. Defina um vencedor.')
      return
    }

    setSavingKnockoutMatchId(matchId)
    setError('')

    try {
      await saveSeasonKnockoutMatchScore(seasonId, matchId, homeGoals, awayGoals, scorers, userId)
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

    if (!seasonId) {
      setError('Nenhuma temporada selecionada.')
      return
    }

    setError('')
    await saveSeasonPlayerProfile(seasonId, player, userId)
  }

  async function handleUploadPhoto(playerId: string, file: File) {
    if (!seasonId) {
      throw new Error('Nenhuma temporada selecionada.')
    }

    return uploadSeasonPlayerPhoto(seasonId, playerId, file)
  }

  async function handleSyncTeamRoster(teamName: string, teamId?: number) {
    return fetchTeamRoster(teamName, teamId)
  }

  return {
    players,
    standings,
    topScorers,
    matches,
    roundMatches,
    byePlayer,
    selectedRound,
    setSelectedRound,
    totalRounds,
    loading,
    error,
    savingMatchId,
    knockoutBracket,
    savingKnockoutMatchId,
    saveScore: handleSaveScore,
    saveKnockoutScore: handleSaveKnockoutScore,
    savePlayer: handleSavePlayer,
    uploadPlayerPhoto: handleUploadPhoto,
    syncTeamRoster: handleSyncTeamRoster,
  }
}
