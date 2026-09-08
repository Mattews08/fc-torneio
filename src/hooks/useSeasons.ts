import { useEffect, useMemo, useState } from 'react'
import type { Player, Season } from '../domain/tournament'
import {
  createSeason,
  migrateLegacySeasonIfNeeded,
  subscribeSeasons,
} from '../services/tournamentRepository'

// Cuida da lista de temporadas: assina a colecao "seasons", mantem qual esta
// selecionada e expoe as acoes de criar uma temporada nova e migrar os dados
// antigos (de antes desse recurso existir) para virarem a "Temporada 1".
export function useSeasons(userId: string | undefined) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [needsMigrationCheck, setNeedsMigrationCheck] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeSeasons(
      (nextSeasons) => {
        setSeasons(nextSeasons)
        setLoading(false)
      },
      (firebaseError) => {
        setError(firebaseError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => b.id.localeCompare(a.id)),
    [seasons],
  )

  useEffect(() => {
    if (sortedSeasons.length === 0) {
      setSelectedSeasonId(undefined)
      return
    }

    setSelectedSeasonId((current) => {
      if (current && sortedSeasons.some((season) => season.id === current)) {
        return current
      }

      return sortedSeasons[0].id
    })
  }, [sortedSeasons])

  // Depois que a primeira carga terminar, se nao existir nenhuma temporada
  // ainda, oferecemos a migracao dos dados antigos (nao dispara sozinho: o
  // usuario precisa clicar no banner pra confirmar a gravacao no Firestore).
  const showMigrationBanner = !loading && needsMigrationCheck && seasons.length === 0

  async function handleCreateSeason(name: string, rounds: number, players: Player[]) {
    if (!userId) {
      setError('Entre com o Google antes de criar uma temporada.')
      return
    }

    setCreating(true)
    setError('')

    try {
      const seasonId = await createSeason(name, rounds, players, userId)
      setSelectedSeasonId(seasonId)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel criar a temporada.')
    } finally {
      setCreating(false)
    }
  }

  async function handleMigrateLegacySeason() {
    if (!userId) {
      setError('Entre com o Google antes de migrar os dados.')
      return
    }

    setMigrating(true)
    setError('')

    try {
      const seasonId = await migrateLegacySeasonIfNeeded(userId)
      setNeedsMigrationCheck(false)
      if (seasonId) {
        setSelectedSeasonId(seasonId)
      }
    } catch (migrateError) {
      setError(migrateError instanceof Error ? migrateError.message : 'Nao foi possivel migrar a temporada atual.')
    } finally {
      setMigrating(false)
    }
  }

  const selectedSeason = sortedSeasons.find((season) => season.id === selectedSeasonId)

  return {
    seasons: sortedSeasons,
    selectedSeason,
    selectedSeasonId,
    setSelectedSeasonId,
    loading,
    error,
    creating,
    migrating,
    showMigrationBanner,
    createSeason: handleCreateSeason,
    migrateLegacySeason: handleMigrateLegacySeason,
  }
}
