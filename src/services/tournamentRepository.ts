import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type CollectionReference,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import {
  drawSeasonMatches,
  knockoutStages,
  mergeMatchesWithDefaults,
  mergePlayersWithDefaults,
  TOTAL_ROUNDS,
  type KnockoutMatch,
  type Match,
  type Player,
  type ScorerEntry,
  type Season,
} from '../domain/tournament'
import { db, storage } from './firebase'

type DataCallback<T> = (data: T[]) => void
type ErrorCallback = (error: FirestoreError) => void

// Colecoes "legadas" (na raiz do Firestore) que existiam antes das temporadas.
// So sao lidas pela migracao unica que transforma esses dados na "Temporada 1".
const legacyPlayersRef = collection(db, 'players')
const legacyMatchesRef = collection(db, 'matches')
const legacyKnockoutMatchesRef = collection(db, 'knockoutMatches')

const seasonsRef = collection(db, 'seasons')
const LEGACY_SEASON_ID = 'season-1'

function seasonPlayersRef(seasonId: string): CollectionReference {
  return collection(db, 'seasons', seasonId, 'players')
}

function seasonMatchesRef(seasonId: string): CollectionReference {
  return collection(db, 'seasons', seasonId, 'matches')
}

function seasonKnockoutMatchesRef(seasonId: string): CollectionReference {
  return collection(db, 'seasons', seasonId, 'knockoutMatches')
}

export function subscribeSeasons(onData: DataCallback<Season>, onError: ErrorCallback): Unsubscribe {
  return onSnapshot(
    seasonsRef,
    (snapshot) => {
      onData(snapshot.docs.map((item) => item.data() as Season))
    },
    onError,
  )
}

export function subscribeSeasonPlayers(seasonId: string, onData: DataCallback<Player>, onError: ErrorCallback): Unsubscribe {
  return onSnapshot(
    seasonPlayersRef(seasonId),
    (snapshot) => {
      onData(snapshot.docs.map((item) => item.data() as Player))
    },
    onError,
  )
}

export function subscribeSeasonMatches(seasonId: string, onData: DataCallback<Match>, onError: ErrorCallback): Unsubscribe {
  return onSnapshot(
    seasonMatchesRef(seasonId),
    (snapshot) => {
      const matches = snapshot.docs
        .map((item) => item.data() as Match)
        .sort((a, b) => a.round - b.round || a.id.localeCompare(b.id))

      onData(matches)
    },
    onError,
  )
}

export function subscribeSeasonKnockoutMatches(
  seasonId: string,
  onData: DataCallback<KnockoutMatch>,
  onError: ErrorCallback,
): Unsubscribe {
  return onSnapshot(
    seasonKnockoutMatchesRef(seasonId),
    (snapshot) => {
      const matches = snapshot.docs
        .map((item) => item.data() as KnockoutMatch)
        .sort((a, b) => knockoutStages.indexOf(a.id) - knockoutStages.indexOf(b.id))

      onData(matches)
    },
    onError,
  )
}

// Cria uma temporada nova: grava o elenco informado e sorteia os confrontos
// (cada rodada e sorteada de forma independente, entao a mesma dupla pode se
// encontrar mais de uma vez). Tudo em um unico batch, pra a temporada nunca
// ficar "pela metade" se algo falhar no meio do caminho.
export async function createSeason(name: string, rounds: number, players: Player[], userId: string): Promise<string> {
  const seasonDocRef = doc(seasonsRef)
  const seasonId = seasonDocRef.id
  const matches = drawSeasonMatches(
    players.map((player) => player.id),
    rounds,
  )

  const batch = writeBatch(db)

  batch.set(seasonDocRef, {
    id: seasonId,
    name,
    rounds,
    status: 'active',
    createdAt: serverTimestamp(),
    createdBy: userId,
  })

  for (const player of players) {
    batch.set(doc(seasonPlayersRef(seasonId), player.id), player)
  }

  for (const match of matches) {
    batch.set(doc(seasonMatchesRef(seasonId), match.id), match)
  }

  await batch.commit()

  return seasonId
}

// Sorteia os confrontos de uma temporada ja existente de novo, substituindo
// as partidas atuais (apaga as antigas e grava as novas no mesmo batch). Deve
// ser usado so quando ninguem ainda jogou nenhuma partida dessa temporada —
// o chamador e responsavel por checar isso antes.
export async function redrawSeasonMatches(seasonId: string, rounds: number, playerIds: string[], userId: string): Promise<void> {
  const existingMatchesSnap = await getDocs(seasonMatchesRef(seasonId))
  const matches = drawSeasonMatches(playerIds, rounds)

  const batch = writeBatch(db)

  for (const existingMatch of existingMatchesSnap.docs) {
    batch.delete(existingMatch.ref)
  }

  for (const match of matches) {
    batch.set(doc(seasonMatchesRef(seasonId), match.id), match)
  }

  batch.set(
    doc(seasonsRef, seasonId),
    { redrawnAt: serverTimestamp(), redrawnBy: userId },
    { merge: true },
  )

  await batch.commit()
}

export async function saveSeasonMatchScore(
  seasonId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  scorers: ScorerEntry[],
  userId: string,
) {
  await setDoc(
    doc(seasonMatchesRef(seasonId), matchId),
    {
      homeGoals,
      awayGoals,
      played: true,
      scorers,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  )
}

export async function saveSeasonKnockoutMatchScore(
  seasonId: string,
  stageId: string,
  homeGoals: number,
  awayGoals: number,
  scorers: ScorerEntry[],
  userId: string,
) {
  await setDoc(
    doc(seasonKnockoutMatchesRef(seasonId), stageId),
    {
      id: stageId,
      homeGoals,
      awayGoals,
      played: true,
      scorers,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  )
}

export async function saveSeasonPlayerProfile(seasonId: string, player: Player, userId: string) {
  await setDoc(
    doc(seasonPlayersRef(seasonId), player.id),
    {
      ...player,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  )
}

export async function uploadSeasonPlayerPhoto(seasonId: string, playerId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const photoRef = ref(storage, `seasons/${seasonId}/players/${playerId}/photo.${extension}`)

  await uploadBytes(photoRef, file, { contentType: file.type || 'image/jpeg' })

  return getDownloadURL(photoRef)
}

// Verifica se existem dados "legados" (de antes das temporadas existirem) e,
// se ninguem tiver criado nenhuma temporada ainda, transforma esses dados na
// "Temporada 1" automaticamente. E seguro chamar isso toda vez que o app
// carrega: uma vez que exista qualquer temporada, essa funcao nao faz nada.
export async function migrateLegacySeasonIfNeeded(userId: string): Promise<string | null> {
  const existingSeasons = await getDocs(seasonsRef)

  if (!existingSeasons.empty) {
    return null
  }

  const [legacyPlayersSnap, legacyMatchesSnap, legacyKnockoutSnap] = await Promise.all([
    getDocs(legacyPlayersRef),
    getDocs(legacyMatchesRef),
    getDocs(legacyKnockoutMatchesRef),
  ])

  if (legacyPlayersSnap.empty && legacyMatchesSnap.empty) {
    return null
  }

  const legacyPlayers = mergePlayersWithDefaults(legacyPlayersSnap.docs.map((item) => item.data() as Player))
  const legacyMatches = mergeMatchesWithDefaults(legacyMatchesSnap.docs.map((item) => item.data() as Match))
  const legacyKnockoutMatches = legacyKnockoutSnap.docs.map((item) => item.data() as KnockoutMatch)

  const batch = writeBatch(db)

  batch.set(doc(seasonsRef, LEGACY_SEASON_ID), {
    id: LEGACY_SEASON_ID,
    name: 'Temporada 1',
    rounds: TOTAL_ROUNDS,
    status: 'active',
    createdAt: serverTimestamp(),
    createdBy: userId,
  })

  for (const player of legacyPlayers) {
    batch.set(doc(seasonPlayersRef(LEGACY_SEASON_ID), player.id), player)
  }

  for (const match of legacyMatches) {
    batch.set(doc(seasonMatchesRef(LEGACY_SEASON_ID), match.id), match)
  }

  for (const match of legacyKnockoutMatches) {
    batch.set(doc(seasonKnockoutMatchesRef(LEGACY_SEASON_ID), match.id), match)
  }

  await batch.commit()

  return LEGACY_SEASON_ID
}
