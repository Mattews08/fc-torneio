import { describe, expect, it } from 'vitest'
import {
  calculateStandings,
  calculateTopScorers,
  defaultMatches,
  defaultPlayers,
  getCurrentRound,
  getKnockoutBracket,
  getRoundBye,
  getRoundMatches,
  getRoundStatus,
  mergeMatchesWithDefaults,
  mergePlayersWithDefaults,
  resolveKnockoutBracket,
  TOTAL_ROUNDS,
  type KnockoutMatch,
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

describe('getRoundStatus', () => {
  it('is not_started when no match in the round has been played', () => {
    expect(getRoundStatus(defaultMatches, 3)).toBe('not_started')
  })

  it('is in_progress when only some matches in the round have been played', () => {
    const matches = mergeMatchesWithDefaults([{ ...defaultMatches[0], played: true, homeGoals: 1, awayGoals: 0 }])

    expect(getRoundStatus(matches, 1)).toBe('in_progress')
  })

  it('is finished when every match in the round has been played', () => {
    const matches = mergeMatchesWithDefaults(
      getRoundMatches(defaultMatches, 1).map((match) => ({ ...match, played: true, homeGoals: 1, awayGoals: 0 })),
    )

    expect(getRoundStatus(matches, 1)).toBe('finished')
  })
})

describe('getCurrentRound', () => {
  it('opens on round 1 when nothing has been played yet', () => {
    expect(getCurrentRound(defaultMatches)).toBe(1)
  })

  it('opens on the round that is in progress', () => {
    const matches = mergeMatchesWithDefaults([{ ...defaultMatches[0], played: true, homeGoals: 1, awayGoals: 0 }])

    expect(getCurrentRound(matches)).toBe(1)
  })

  it('skips finished rounds and opens on the next round to start', () => {
    const round1Finished = getRoundMatches(defaultMatches, 1).map((match) => ({
      ...match,
      played: true,
      homeGoals: 1,
      awayGoals: 0,
    }))
    const matches = mergeMatchesWithDefaults(round1Finished)

    expect(getCurrentRound(matches)).toBe(2)
  })

  it('falls back to the last round once every round is finished', () => {
    const allFinished = defaultMatches.map((match) => ({ ...match, played: true, homeGoals: 1, awayGoals: 0 }))
    const matches = mergeMatchesWithDefaults(allFinished)

    expect(getCurrentRound(matches)).toBe(TOTAL_ROUNDS)
  })
})

describe('getKnockoutBracket', () => {
  it('gives the 1st place a bye and pairs 2nd x 5th and 3rd x 4th', () => {
    const standings = calculateStandings(defaultPlayers, [])
    const bracket = getKnockoutBracket(standings)

    expect(bracket.bye).toEqual({ seed: 1, row: standings[0] })
    expect(bracket.semifinals[0]).toEqual({
      home: { seed: 2, row: standings[1] },
      away: { seed: 5, row: standings[4] },
    })
    expect(bracket.semifinals[1]).toEqual({
      home: { seed: 3, row: standings[2] },
      away: { seed: 4, row: standings[3] },
    })
  })

  it('leaves a seed without a row when the standings list is shorter than 5', () => {
    const standings = calculateStandings(defaultPlayers, []).slice(0, 3)
    const bracket = getKnockoutBracket(standings)

    expect(bracket.semifinals[0].away.row).toBeUndefined()
    expect(bracket.semifinals[1].away.row).toBeUndefined()
  })
})

describe('resolveKnockoutBracket', () => {
  // Sem partidas jogadas, a classificacao empata em pontos e desempata em
  // ordem alfabetica: Capflint, Falcon, Leo, Manduca, NSB.
  const standings = calculateStandings(defaultPlayers, [])

  function knockoutMatch(id: KnockoutMatch['id'], homeGoals: number, awayGoals: number): KnockoutMatch {
    return { id, homeGoals, awayGoals, played: true, scorers: [] }
  }

  it('lets both semifinals be played right away, but keeps the final and grand final locked', () => {
    const bracket = resolveKnockoutBracket(standings, [])

    expect(bracket.sf1.home.player?.name).toBe('Falcon')
    expect(bracket.sf1.away.player?.name).toBe('NSB')
    expect(bracket.sf2.home.player?.name).toBe('Leo')
    expect(bracket.sf2.away.player?.name).toBe('Manduca')

    expect(bracket.final.home.player).toBeUndefined()
    expect(bracket.final.away.player).toBeUndefined()
    expect(bracket.final.home.label).toBe('Vencedor SF1')
    expect(bracket.final.away.label).toBe('Vencedor SF2')

    // O 1o colocado (Capflint) ja aparece na grande final, esperando o vencedor da final.
    expect(bracket.grandFinal.home.player?.name).toBe('Capflint')
    expect(bracket.grandFinal.away.player).toBeUndefined()
    expect(bracket.champion).toBeUndefined()
  })

  it('advances the semifinal winners into the final once both are played', () => {
    const bracket = resolveKnockoutBracket(standings, [knockoutMatch('sf1', 2, 1), knockoutMatch('sf2', 0, 3)])

    expect(bracket.final.home.player?.name).toBe('Falcon')
    expect(bracket.final.away.player?.name).toBe('Manduca')
  })

  it('crowns a champion once the grand final is decided', () => {
    const bracket = resolveKnockoutBracket(standings, [
      knockoutMatch('sf1', 2, 1),
      knockoutMatch('sf2', 0, 3),
      knockoutMatch('final', 1, 4),
      knockoutMatch('grandFinal', 2, 3),
    ])

    expect(bracket.grandFinal.home.player?.name).toBe('Capflint')
    expect(bracket.grandFinal.away.player?.name).toBe('Manduca')
    expect(bracket.champion?.name).toBe('Manduca')
  })

  it('does not advance a drawn score, since the mata-mata cannot end in a tie', () => {
    const bracket = resolveKnockoutBracket(standings, [knockoutMatch('sf1', 1, 1), knockoutMatch('sf2', 0, 3)])

    expect(bracket.final.home.player).toBeUndefined()
    expect(bracket.final.away.player?.name).toBe('Manduca')
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
