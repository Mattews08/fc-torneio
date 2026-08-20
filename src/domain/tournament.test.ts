import { describe, expect, it } from 'vitest'
import {
  calculateStandings,
  calculateTopScorers,
  defaultMatches,
  defaultPlayers,
  getRoundBye,
  getRoundMatches,
  mergeMatchesWithDefaults,
  mergePlayersWithDefaults,
  type Match,
} from './tournament'

describe('tournament fixtures', () => {
  it('uses the 10-round fixture list from the PDF', () => {
    expect(defaultPlayers.map((player) => player.name)).toEqual([
      'Capflint',
      'Manduca',
      'Falcon',
      'Leo',
      'NSB',
    ])
    expect(defaultMatches).toHaveLength(20)
    expect(getRoundMatches(defaultMatches, 1).map((match) => `${match.homePlayerId} x ${match.awayPlayerId}`)).toEqual([
      'manduca x nsb',
      'falcon x leo',
    ])
    expect(getRoundBye(defaultMatches, 1)).toBe('capflint')
    expect(getRoundBye(defaultMatches, 10)).toBe('falcon')
  })
})

describe('default data merging', () => {
  it('keeps the full fixture list when Firestore only has one saved match', () => {
    const savedMatch: Match = {
      ...defaultMatches[1],
      homeGoals: 2,
      awayGoals: 0,
      played: true,
    }

    const mergedMatches = mergeMatchesWithDefaults([savedMatch])

    expect(mergedMatches).toHaveLength(20)
    expect(mergedMatches[1]).toMatchObject({
      id: 'r1-falcon-leo',
      homeGoals: 2,
      awayGoals: 0,
      played: true,
    })
    expect(mergedMatches[0]).toMatchObject({
      id: 'r1-manduca-nsb',
      played: false,
    })
  })

  it('keeps default players when Firestore has not been seeded yet', () => {
    expect(mergePlayersWithDefaults([]).map((player) => player.id)).toEqual(defaultPlayers.map((player) => player.id))
  })

  it('replaces old placeholder team names with real default clubs', () => {
    const mergedPlayers = mergePlayersWithDefaults([
      {
        id: 'capflint',
        name: 'Capflint',
        teamName: 'Time Capflint',
        crestUrl: '',
        photoUrl: '',
      },
    ])

    expect(mergedPlayers.find((player) => player.id === 'capflint')?.teamName).toBe('Bayern Munich')
  })
})

describe('calculateStandings', () => {
  it('ignores incomplete matches and calculates match stats from completed scores', () => {
    const matches: Match[] = [
      {
        id: 'match-1',
        round: 1,
        leg: 'turno',
        homePlayerId: 'capflint',
        awayPlayerId: 'manduca',
        byePlayerId: 'falcon',
        homeGoals: 2,
        awayGoals: 1,
        played: true,
      },
      {
        id: 'match-2',
        round: 1,
        leg: 'turno',
        homePlayerId: 'falcon',
        awayPlayerId: 'leo',
        byePlayerId: 'nsb',
        homeGoals: null,
        awayGoals: null,
        played: false,
      },
    ]

    const standings = calculateStandings(defaultPlayers, matches)

    expect(standings[0]).toMatchObject({
      playerId: 'capflint',
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 1,
      goalDifference: 1,
      points: 3,
    })
    expect(standings.find((row) => row.playerId === 'falcon')).toMatchObject({
      played: 0,
      points: 0,
    })
  })

  it('sorts by points, wins, goal difference, goals for, and head-to-head points', () => {
    const matches: Match[] = [
      {
        id: 'capflint-beats-manduca',
        round: 1,
        leg: 'turno',
        homePlayerId: 'capflint',
        awayPlayerId: 'manduca',
        byePlayerId: 'nsb',
        homeGoals: 2,
        awayGoals: 1,
        played: true,
      },
      {
        id: 'manduca-beats-capflint',
        round: 6,
        leg: 'returno',
        homePlayerId: 'manduca',
        awayPlayerId: 'capflint',
        byePlayerId: 'nsb',
        homeGoals: 4,
        awayGoals: 2,
        played: true,
      },
      {
        id: 'falcon-big-win',
        round: 2,
        leg: 'turno',
        homePlayerId: 'falcon',
        awayPlayerId: 'leo',
        byePlayerId: 'capflint',
        homeGoals: 5,
        awayGoals: 0,
        played: true,
      },
      {
        id: 'nsb-draw',
        round: 3,
        leg: 'turno',
        homePlayerId: 'nsb',
        awayPlayerId: 'leo',
        byePlayerId: 'manduca',
        homeGoals: 1,
        awayGoals: 1,
        played: true,
      },
    ]

    const standings = calculateStandings(defaultPlayers, matches)

    expect(standings.map((row) => row.playerId)).toEqual([
      'falcon',
      'manduca',
      'capflint',
      'nsb',
      'leo',
    ])
  })
})

describe('calculateTopScorers', () => {
  it('sums scorer goals across completed matches and sorts by goals', () => {
    const matches: Match[] = [
      {
        ...defaultMatches[0],
        homeGoals: 3,
        awayGoals: 1,
        played: true,
        scorers: [
          { id: 's1', name: 'Haaland', teamPlayerId: 'manduca', goals: 2 },
          { id: 's2', name: 'Vini Jr', teamPlayerId: 'nsb', goals: 1 },
        ],
      },
      {
        ...defaultMatches[1],
        homeGoals: 2,
        awayGoals: 0,
        played: true,
        scorers: [
          { id: 's3', name: 'Haaland', teamPlayerId: 'manduca', goals: 1 },
          { id: 's4', name: 'Mbappe', teamPlayerId: 'falcon', goals: 2 },
        ],
      },
      {
        ...defaultMatches[2],
        played: false,
        scorers: [{ id: 's5', name: 'Nao Conta', teamPlayerId: 'capflint', goals: 9 }],
      },
    ]

    expect(calculateTopScorers(defaultPlayers, matches)).toEqual([
      {
        key: 'manduca:haaland',
        name: 'Haaland',
        teamPlayerId: 'manduca',
        teamName: 'Manduca',
        goals: 3,
        matches: 2,
      },
      {
        key: 'falcon:mbappe',
        name: 'Mbappe',
        teamPlayerId: 'falcon',
        teamName: 'Falcon',
        goals: 2,
        matches: 1,
      },
      {
        key: 'nsb:vini jr',
        name: 'Vini Jr',
        teamPlayerId: 'nsb',
        teamName: 'NSB',
        goals: 1,
        matches: 1,
      },
    ])
  })
})
