import type { SquadPlayer } from '../domain/tournament'

const API_BASE_URL = 'https://v3.football.api-sports.io'

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

type ApiTeamSearchResponse = {
  response?: Array<{
    team?: {
      id?: number
      name?: string
      logo?: string
    }
  }>
}

type ApiSquadResponse = {
  response?: Array<{
    players?: Array<{
      id?: number
      name?: string
      age?: number
      number?: number | null
      position?: string
      photo?: string
      [key: string]: unknown
    }>
  }>
}

export async function fetchTeamRoster(teamName: string): Promise<SyncedTeamRoster> {
  const apiKey = import.meta.env.VITE_APISPORTS_KEY

  if (!apiKey) {
    throw new Error('Configure VITE_APISPORTS_KEY no arquivo .env.local.')
  }

  const team = await searchTeam(teamName, apiKey)
  const squad = await fetchSquad(team.id, apiKey)

  return {
    teamId: team.id,
    teamName: team.name,
    crestUrl: team.logo,
    squad,
  }
}

export function normalizeTeamSearchResponse(data: ApiTeamSearchResponse): ApiFootballTeam | null {
  for (const item of data.response ?? []) {
    const id = item.team?.id
    const name = item.team?.name?.trim()

    if (typeof id === 'number' && name) {
      return {
        id,
        name,
        logo: item.team?.logo ?? '',
      }
    }
  }

  return null
}

export function normalizeSquadResponse(data: ApiSquadResponse): SquadPlayer[] {
  return (data.response?.[0]?.players ?? [])
    .filter((player): player is Required<Pick<SquadPlayer, 'id' | 'name'>> & Partial<SquadPlayer> => {
      return typeof player.id === 'number' && Boolean(player.name?.trim())
    })
    .map((player) => ({
      id: player.id,
      name: player.name.trim(),
      number: typeof player.number === 'number' ? player.number : null,
      position: player.position ?? '',
      photo: player.photo ?? '',
    }))
}

async function searchTeam(teamName: string, apiKey: string) {
  const response = await fetch(`${API_BASE_URL}/teams?search=${encodeURIComponent(teamName)}`, {
    headers: { 'x-apisports-key': apiKey },
  })

  if (!response.ok) {
    throw new Error(`API-Football falhou ao buscar time (${response.status}).`)
  }

  const team = normalizeTeamSearchResponse(await response.json())

  if (!team) {
    throw new Error(`Nenhum time encontrado para "${teamName}".`)
  }

  return team
}

async function fetchSquad(teamId: number, apiKey: string) {
  const response = await fetch(`${API_BASE_URL}/players/squads?team=${teamId}`, {
    headers: { 'x-apisports-key': apiKey },
  })

  if (!response.ok) {
    throw new Error(`API-Football falhou ao buscar elenco (${response.status}).`)
  }

  return normalizeSquadResponse(await response.json())
}
