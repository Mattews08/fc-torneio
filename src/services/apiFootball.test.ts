import { describe, expect, it } from 'vitest'
import { normalizeSquadResponse, normalizeTeamSearchResponse } from './apiFootball'

describe('apiFootball normalizers', () => {
  it('normalizes the first API-Football team result with crest URL', () => {
    expect(
      normalizeTeamSearchResponse({
        response: [
          {
            team: {
              id: 541,
              name: 'Real Madrid',
              logo: 'https://media.api-sports.io/football/teams/541.png',
            },
          },
        ],
      }),
    ).toEqual({
      id: 541,
      name: 'Real Madrid',
      logo: 'https://media.api-sports.io/football/teams/541.png',
    })
  })

  it('normalizes squad players and ignores malformed entries', () => {
    expect(
      normalizeSquadResponse({
        response: [
          {
            players: [
              { id: 1, name: 'Kylian Mbappe', age: 27, number: 10, position: 'Attacker', photo: 'mbappe.png' },
              { id: 2, name: '', position: 'Goalkeeper' },
              { id: 3, name: 'Vinicius Junior', position: 'Attacker' },
            ],
          },
        ],
      }),
    ).toEqual([
      { id: 1, name: 'Kylian Mbappe', number: 10, position: 'Attacker', photo: 'mbappe.png' },
      { id: 3, name: 'Vinicius Junior', number: null, position: 'Attacker', photo: '' },
    ])
  })
})
