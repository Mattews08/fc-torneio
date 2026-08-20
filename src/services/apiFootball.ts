import type { SquadPlayer } from '../domain/tournament'

const API_BASE_URL = 'https://api.api-futebol.com.br/v1'

export type ApiFootballTeam = {
  id: number
  name: string
  logo: string
}

export type SyncedTeamRoster = {
  teamId: number
  teamName: string
  crestUrl: string
  squad: SquadPlayer[]
}

type ApiFutebolTeamResponse = {
  time_id?: number
  nome_popular?: string
  nome?: string
  sigla?: string
  escudo?: string
  apelido?: string
}

type ApiFutebolErrorResponse = {
  message?: string
}

export async function fetchTeamRoster(teamName: string, teamId?: number): Promise<SyncedTeamRoster> {
  const apiKey = import.meta.env.VITE_API_FUTEBOL_KEY

  if (!apiKey) {
    throw new Error('Configure VITE_API_FUTEBOL_KEY no arquivo .env.local.')
  }

  if (!teamId) {
    throw new Error('Informe o ID do time na API-Futebol antes de puxar dados.')
  }

  const team = normalizeApiFutebolTeamResponse(await requestApiFutebol<ApiFutebolTeamResponse>(`/times/${teamId}`, apiKey))

  return {
    teamId: team.id,
    teamName: team.name || teamName,
    crestUrl: team.logo,
    squad: [],
  }
}

export function normalizeApiFutebolTeamResponse(data: ApiFutebolTeamResponse): ApiFootballTeam {
  return {
    id: typeof data.time_id === 'number' ? data.time_id : 0,
    name: data.nome_popular?.trim() || data.nome?.trim() || '',
    logo: data.escudo ?? '',
  }
}

async function requestApiFutebol<T>(path: string, apiKey: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
  } catch {
    throw new Error('Nao consegui acessar a API-Futebol pelo navegador. Confira a chave e tente novamente.')
  }

  if (!response.ok) {
    const apiMessage = await readApiFutebolError(response)
    throw new Error(apiMessage ?? `API-Futebol falhou ao buscar time (${response.status}).`)
  }

  return response.json()
}

async function readApiFutebolError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return 'Chave da API-Futebol invalida. Confira a VITE_API_FUTEBOL_KEY.'
  }

  try {
    const data = (await response.json()) as ApiFutebolErrorResponse

    if (typeof data.message === 'string' && data.message) {
      return data.message
    }
  } catch {
    return null
  }

  return null
}
