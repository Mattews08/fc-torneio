import { defaultSquads } from './squads'

export type Player = {
  id: string
  name: string
  teamName: string
  crestUrl: string
  photoUrl: string
  apiFootballTeamId?: number
  squad?: SquadPlayer[]
}

export type SquadPlayer = {
  id: number
  name: string
  number: number | null
  position: string
  photo: string
}

export type ScorerEntry = {
  id: string
  name: string
  teamPlayerId: string
  goals: number
}

export type Match = {
  id: string
  round: number
  leg: 'turno' | 'returno'
  homePlayerId: string
  awayPlayerId: string
  byePlayerId: string
  homeGoals: number | null
  awayGoals: number | null
  played: boolean
  scorers?: ScorerEntry[]
}

export type StandingRow = {
  playerId: string
  player: Player
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export type TopScorerRow = {
  key: string
  name: string
  teamPlayerId: string
  teamName: string
  goals: number
  matches: number
}

export const defaultPlayers: Player[] = [
  {
    id: 'capflint',
    name: 'Capflint',
    teamName: 'Bayern Munich',
    crestUrl: '',
    photoUrl: '',
    squad: defaultSquads.capflint,
  },
  {
    id: 'manduca',
    name: 'Manduca',
    teamName: 'Time Manduca',
    crestUrl: '',
    photoUrl: '',
    squad: defaultSquads.manduca,
  },
  {
    id: 'falcon',
    name: 'Falcon',
    teamName: 'Time Falcon',
    crestUrl: '',
    photoUrl: '',
    squad: defaultSquads.falcon,
  },
  {
    id: 'leo',
    name: 'Leo',
    teamName: 'Time Leo',
    crestUrl: '',
    photoUrl: '',
    squad: defaultSquads.leo,
  },
  {
    id: 'nsb',
    name: 'NSB',
    teamName: 'Time NSB',
    crestUrl: '',
    photoUrl: '',
    squad: defaultSquads.nsb,
  },
]

const fixture = (
  id: string,
  round: number,
  leg: Match['leg'],
  homePlayerId: string,
  awayPlayerId: string,
  byePlayerId: string,
): Match => ({
  id,
  round,
  leg,
  homePlayerId,
  awayPlayerId,
  byePlayerId,
  homeGoals: null,
  awayGoals: null,
  played: false,
  scorers: [],
})

export const defaultMatches: Match[] = [
  fixture('r1-manduca-nsb', 1, 'turno', 'manduca', 'nsb', 'capflint'),
  fixture('r1-falcon-leo', 1, 'turno', 'falcon', 'leo', 'capflint'),
  fixture('r2-capflint-nsb', 2, 'turno', 'capflint', 'nsb', 'leo'),
  fixture('r2-manduca-falcon', 2, 'turno', 'manduca', 'falcon', 'leo'),
  fixture('r3-leo-capflint', 3, 'turno', 'leo', 'capflint', 'manduca'),
  fixture('r3-nsb-falcon', 3, 'turno', 'nsb', 'falcon', 'manduca'),
  fixture('r4-falcon-capflint', 4, 'turno', 'falcon', 'capflint', 'nsb'),
  fixture('r4-leo-manduca', 4, 'turno', 'leo', 'manduca', 'nsb'),
  fixture('r5-capflint-manduca', 5, 'turno', 'capflint', 'manduca', 'falcon'),
  fixture('r5-nsb-leo', 5, 'turno', 'nsb', 'leo', 'falcon'),
  fixture('r6-nsb-manduca', 6, 'returno', 'nsb', 'manduca', 'capflint'),
  fixture('r6-leo-falcon', 6, 'returno', 'leo', 'falcon', 'capflint'),
  fixture('r7-nsb-capflint', 7, 'returno', 'nsb', 'capflint', 'leo'),
  fixture('r7-falcon-manduca', 7, 'returno', 'falcon', 'manduca', 'leo'),
  fixture('r8-capflint-leo', 8, 'returno', 'capflint', 'leo', 'manduca'),
  fixture('r8-falcon-nsb', 8, 'returno', 'falcon', 'nsb', 'manduca'),
  fixture('r9-capflint-falcon', 9, 'returno', 'capflint', 'falcon', 'nsb'),
  fixture('r9-manduca-leo', 9, 'returno', 'manduca', 'leo', 'nsb'),
  fixture('r10-manduca-capflint', 10, 'returno', 'manduca', 'capflint', 'falcon'),
  fixture('r10-leo-nsb', 10, 'returno', 'leo', 'nsb', 'falcon'),
]

export const TOTAL_ROUNDS = Math.max(...defaultMatches.map((match) => match.round))

export type RoundStatus = 'not_started' | 'in_progress' | 'finished'

export function getRoundMatches(matches: Match[], round: number): Match[] {
  return matches.filter((match) => match.round === round)
}

export function getRoundBye(matches: Match[], round: number): string | undefined {
  return matches.find((match) => match.round === round)?.byePlayerId
}

export function getRoundStatus(matches: Match[], round: number): RoundStatus {
  const matchesInRound = getRoundMatches(matches, round)

  if (matchesInRound.length === 0) {
    return 'not_started'
  }

  const playedCount = matchesInRound.filter((match) => match.played).length

  if (playedCount === 0) {
    return 'not_started'
  }

  if (playedCount === matchesInRound.length) {
    return 'finished'
  }

  return 'in_progress'
}

// Retorna a primeira rodada que ainda nao foi finalizada (em andamento ou prestes
// a comecar), para o painel abrir direto nela em vez de sempre cair na Rodada 1.
export function getCurrentRound(matches: Match[]): number {
  for (let round = 1; round <= TOTAL_ROUNDS; round += 1) {
    if (getRoundStatus(matches, round) !== 'finished') {
      return round
    }
  }

  return TOTAL_ROUNDS
}

export function mergePlayersWithDefaults(firestorePlayers: Player[]): Player[] {
  return mergeById(defaultPlayers, firestorePlayers)
    .map(replaceLegacyPlaceholderTeamName)
    .map(fallBackToDefaultSquad)
}

export function mergeMatchesWithDefaults(firestoreMatches: Match[]): Match[] {
  return mergeById(defaultMatches, firestoreMatches)
}

export function calculateStandings(players: Player[], matches: Match[]): StandingRow[] {
  const rows = new Map<string, StandingRow>()

  for (const player of players) {
    rows.set(player.id, {
      playerId: player.id,
      player,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })
  }

  for (const match of matches) {
    if (!isCompletedMatch(match)) {
      continue
    }

    const home = rows.get(match.homePlayerId)
    const away = rows.get(match.awayPlayerId)

    if (!home || !away) {
      continue
    }

    applyResult(home, match.homeGoals, match.awayGoals)
    applyResult(away, match.awayGoals, match.homeGoals)
  }

  const completedMatches = matches.filter(isCompletedMatch)

  return [...rows.values()].sort((a, b) => {
    const primary =
      b.points - a.points ||
      b.wins - a.wins ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      headToHeadPoints(b.playerId, a.playerId, completedMatches) -
        headToHeadPoints(a.playerId, b.playerId, completedMatches)

    return primary || a.player.name.localeCompare(b.player.name)
  })
}

export function calculateTopScorers(players: Player[], matches: Match[]): TopScorerRow[] {
  const playerById = new Map(players.map((player) => [player.id, player]))
  const rows = new Map<string, TopScorerRow & { matchIds: Set<string> }>()

  for (const match of matches) {
    if (!isCompletedMatch(match)) {
      continue
    }

    for (const scorer of match.scorers ?? []) {
      const name = scorer.name.trim()

      if (!name || !Number.isInteger(scorer.goals) || scorer.goals <= 0) {
        continue
      }

      const key = `${scorer.teamPlayerId}:${name.toLowerCase()}`
      const existing = rows.get(key)

      if (existing) {
        existing.goals += scorer.goals
        existing.matchIds.add(match.id)
        existing.matches = existing.matchIds.size
      } else {
        rows.set(key, {
          key,
          name,
          teamPlayerId: scorer.teamPlayerId,
          teamName: playerById.get(scorer.teamPlayerId)?.name ?? 'Sem time',
          goals: scorer.goals,
          matches: 1,
          matchIds: new Set([match.id]),
        })
      }
    }
  }

  return [...rows.values()]
    .map(({ matchIds: _matchIds, ...row }) => row)
    .sort((a, b) => b.goals - a.goals || a.matches - b.matches || a.name.localeCompare(b.name))
}

function mergeById<T extends { id: string }>(defaults: T[], overrides: T[]): T[] {
  const overrideById = new Map(overrides.map((item) => [item.id, item]))

  return defaults.map((item) => ({
    ...item,
    ...overrideById.get(item.id),
  }))
}

function fallBackToDefaultSquad(player: Player): Player {
  if (player.squad && player.squad.length > 0) {
    return player
  }

  const defaultSquad = defaultPlayers.find((item) => item.id === player.id)?.squad

  if (!defaultSquad || defaultSquad.length === 0) {
    return player
  }

  return {
    ...player,
    squad: defaultSquad,
  }
}

function replaceLegacyPlaceholderTeamName(player: Player): Player {
  const defaultPlayer = defaultPlayers.find((item) => item.id === player.id)
  const legacyTeamName = `Time ${defaultPlayer?.name}`

  if (defaultPlayer && player.teamName === legacyTeamName) {
    return {
      ...player,
      teamName: defaultPlayer.teamName,
    }
  }

  return player
}

function isCompletedMatch(match: Match): match is Match & { homeGoals: number; awayGoals: number } {
  return (
    match.played &&
    typeof match.homeGoals === 'number' &&
    typeof match.awayGoals === 'number' &&
    Number.isInteger(match.homeGoals) &&
    Number.isInteger(match.awayGoals) &&
    match.homeGoals >= 0 &&
    match.awayGoals >= 0
  )
}

function applyResult(row: StandingRow, goalsFor: number, goalsAgainst: number) {
  row.played += 1
  row.goalsFor += goalsFor
  row.goalsAgainst += goalsAgainst
  row.goalDifference = row.goalsFor - row.goalsAgainst

  if (goalsFor > goalsAgainst) {
    row.wins += 1
    row.points += 3
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1
    row.points += 1
  } else {
    row.losses += 1
  }
}

function headToHeadPoints(playerId: string, opponentId: string, matches: Array<Match & { homeGoals: number; awayGoals: number }>) {
  return matches.reduce((points, match) => {
    const isHome = match.homePlayerId === playerId && match.awayPlayerId === opponentId
    const isAway = match.awayPlayerId === playerId && match.homePlayerId === opponentId

    if (!isHome && !isAway) {
      return points
    }

    const playerGoals = isHome ? match.homeGoals : match.awayGoals
    const opponentGoals = isHome ? match.awayGoals : match.homeGoals

    if (playerGoals > opponentGoals) {
      return points + 3
    }

    if (playerGoals === opponentGoals) {
      return points + 1
    }

    return points
  }, 0)
}
