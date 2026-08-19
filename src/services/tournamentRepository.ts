import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { defaultMatches, defaultPlayers, type Match, type Player, type ScorerEntry } from '../domain/tournament'
import { db, storage } from './firebase'

type DataCallback<T> = (data: T[]) => void
type ErrorCallback = (error: FirestoreError) => void

const playersRef = collection(db, 'players')
const matchesRef = collection(db, 'matches')

export function subscribePlayers(onData: DataCallback<Player>, onError: ErrorCallback): Unsubscribe {
  return onSnapshot(
    playersRef,
    (snapshot) => {
      const players = snapshot.docs
        .map((item) => item.data() as Player)
        .sort((a, b) => getPlayerOrder(a.id) - getPlayerOrder(b.id))

      onData(players)
    },
    onError,
  )
}

export function subscribeMatches(onData: DataCallback<Match>, onError: ErrorCallback): Unsubscribe {
  return onSnapshot(
    matchesRef,
    (snapshot) => {
      const matches = snapshot.docs
        .map((item) => item.data() as Match)
        .sort((a, b) => a.round - b.round || getMatchOrder(a.id) - getMatchOrder(b.id))

      onData(matches)
    },
    onError,
  )
}

export async function seedTournament() {
  const batch = writeBatch(db)

  for (const player of defaultPlayers) {
    batch.set(doc(playersRef, player.id), player)
  }

  for (const match of defaultMatches) {
    batch.set(doc(matchesRef, match.id), {
      ...match,
      updatedAt: serverTimestamp(),
      updatedBy: 'seed',
    })
  }

  await batch.commit()
}

export async function saveMatchScore(matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[], userId: string) {
  const defaultMatch = defaultMatches.find((match) => match.id === matchId)

  if (!defaultMatch) {
    throw new Error('Partida nao encontrada na tabela base.')
  }

  await setDoc(doc(matchesRef, matchId), {
    ...defaultMatch,
    homeGoals,
    awayGoals,
    played: true,
    scorers,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  }, { merge: true })
}

export async function savePlayerProfile(player: Player, userId: string) {
  await setDoc(doc(playersRef, player.id), {
    ...player,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  }, { merge: true })
}

export async function uploadPlayerPhoto(playerId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const photoRef = ref(storage, `players/${playerId}/photo.${extension}`)

  await uploadBytes(photoRef, file, { contentType: file.type || 'image/jpeg' })

  return getDownloadURL(photoRef)
}

function getPlayerOrder(playerId: string) {
  const index = defaultPlayers.findIndex((player) => player.id === playerId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function getMatchOrder(matchId: string) {
  const index = defaultMatches.findIndex((match) => match.id === matchId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
