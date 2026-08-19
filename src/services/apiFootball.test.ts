import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTeamRoster, normalizeSquadResponse, normalizeTeamSearchResponse } from './apiFootball'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

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

  it('shows the API-Football token error when credentials are rejected', async () => {
    vi.stubEnv('VITE_APISPORTS_KEY', 'invalid-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          errors: {
            token: 'Invalid API key, please check your request and credentials.',
          },
        }),
      }),
    )

    await expect(fetchTeamRoster('Bayern Munchen')).rejects.toThrow(
      'Chave da API-Football invalida. Confira a VITE_APISPORTS_KEY.',
    )
  })

  it('explains browser network failures from API-Football', async () => {
    vi.stubEnv('VITE_APISPORTS_KEY', 'invalid-key')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.')))

    await expect(fetchTeamRoster('Bayern Munchen')).rejects.toThrow(
      'Nao consegui acessar a API-Football pelo navegador. Confira a chave e tente novamente.',
    )
  })
})
