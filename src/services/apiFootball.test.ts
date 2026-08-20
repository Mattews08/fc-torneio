import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTeamRoster, normalizeApiFutebolTeamResponse } from './apiFootball'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('apiFootball API-Futebol integration', () => {
  it('normalizes API-Futebol team details with crest URL', () => {
    expect(
      normalizeApiFutebolTeamResponse({
        time_id: 56,
        nome_popular: 'Palmeiras',
        sigla: 'PAL',
        escudo: 'https://cdn.api-futebol.com.br/times/escudos/palmeiras.svg',
        nome: 'Sociedade Esportiva Palmeiras',
        apelido: 'Verdao',
      }),
    ).toEqual({
      id: 56,
      name: 'Palmeiras',
      logo: 'https://cdn.api-futebol.com.br/times/escudos/palmeiras.svg',
    })
  })

  it('requests API-Futebol team details with bearer authentication', async () => {
    vi.stubEnv('VITE_API_FUTEBOL_KEY', 'api-futebol-key')
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        time_id: 56,
        nome_popular: 'Palmeiras',
        sigla: 'PAL',
        escudo: 'https://cdn.api-futebol.com.br/times/escudos/palmeiras.svg',
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await expect(fetchTeamRoster('Palmeiras', 56)).resolves.toEqual({
      teamId: 56,
      teamName: 'Palmeiras',
      crestUrl: 'https://cdn.api-futebol.com.br/times/escudos/palmeiras.svg',
      squad: [],
    })
    expect(fetchSpy).toHaveBeenCalledWith('https://api.api-futebol.com.br/v1/times/56', {
      headers: { Authorization: 'Bearer api-futebol-key' },
    })
  })

  it('requires an API-Futebol team id before fetching details', async () => {
    vi.stubEnv('VITE_API_FUTEBOL_KEY', 'api-futebol-key')

    await expect(fetchTeamRoster('Bayern Munich')).rejects.toThrow(
      'Informe o ID do time na API-Futebol antes de puxar dados.',
    )
  })

  it('shows the API-Futebol credential error when the bearer token is rejected', async () => {
    vi.stubEnv('VITE_API_FUTEBOL_KEY', 'invalid-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Unauthenticated.',
        }),
      }),
    )

    await expect(fetchTeamRoster('Palmeiras', 56)).rejects.toThrow(
      'Chave da API-Futebol invalida. Confira a VITE_API_FUTEBOL_KEY.',
    )
  })

  it('explains browser network failures from API-Futebol', async () => {
    vi.stubEnv('VITE_API_FUTEBOL_KEY', 'invalid-key')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.')))

    await expect(fetchTeamRoster('Palmeiras', 56)).rejects.toThrow(
      'Nao consegui acessar a API-Futebol pelo navegador. Confira a chave e tente novamente.',
    )
  })
})
