import { describe, expect, it } from 'vitest'
import {
  calculateStandings,
  defaultMatches,
  defaultPlayers,
  getRoundBye,
  getRoundMatches,
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
