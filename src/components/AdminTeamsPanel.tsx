import { Download, ImagePlus, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { Player } from '../domain/tournament'
import type { SyncedTeamRoster } from '../services/apiFootball'

type AdminTeamsPanelProps = {
  players: Player[]
  onSavePlayer: (player: Player) => Promise<void>
  onUploadPhoto: (playerId: string, file: File) => Promise<string>
  onSyncTeamRoster?: (teamName: string) => Promise<SyncedTeamRoster>
}

type PlayerDraft = Player & {
  initialName: string
  photoFile: File | null
}

export function AdminTeamsPanel({ players, onSavePlayer, onUploadPhoto, onSyncTeamRoster }: AdminTeamsPanelProps) {
  const [drafts, setDrafts] = useState<PlayerDraft[]>(() => createDrafts(players))
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null)
  const [syncingPlayerId, setSyncingPlayerId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setDrafts(createDrafts(players))
  }, [players])

  function updateDraft(playerId: string, updates: Partial<PlayerDraft>) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => (draft.id === playerId ? { ...draft, ...updates } : draft)),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, draft: PlayerDraft) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!draft.name.trim() || !draft.teamName.trim()) {
      setError('Preencha jogador e time antes de salvar.')
      return
    }

    setSavingPlayerId(draft.id)

    try {
      const photoUrl = draft.photoFile ? await onUploadPhoto(draft.id, draft.photoFile) : draft.photoUrl

      await onSavePlayer({
        id: draft.id,
        name: draft.name.trim(),
        teamName: draft.teamName.trim(),
        crestUrl: draft.crestUrl.trim(),
        photoUrl,
        apiFootballTeamId: draft.apiFootballTeamId,
        squad: draft.squad,
      })

      updateDraft(draft.id, { photoFile: null, photoUrl })
      setMessage(`${draft.name.trim()} atualizado.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o time.')
    } finally {
      setSavingPlayerId(null)
    }
  }

  async function handleSyncRoster(draft: PlayerDraft) {
    setError('')
    setMessage('')

    if (!onSyncTeamRoster) {
      return
    }

    if (!draft.teamName.trim()) {
      setError('Preencha o time antes de puxar elenco.')
      return
    }

    setSyncingPlayerId(draft.id)

    try {
      const synced = await onSyncTeamRoster(draft.teamName.trim())
      const updatedDraft = {
        ...draft,
        teamName: synced.teamName,
        crestUrl: synced.crestUrl,
        apiFootballTeamId: synced.teamId,
        squad: synced.squad,
      }

      await onSavePlayer({
        id: updatedDraft.id,
        name: updatedDraft.name.trim(),
        teamName: updatedDraft.teamName,
        crestUrl: updatedDraft.crestUrl,
        photoUrl: updatedDraft.photoUrl,
        apiFootballTeamId: updatedDraft.apiFootballTeamId,
        squad: updatedDraft.squad,
      })

      updateDraft(draft.id, updatedDraft)
      setMessage(`${draft.name.trim()} sincronizado com ${synced.teamName}.`)
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Nao foi possivel puxar o elenco.')
    } finally {
      setSyncingPlayerId(null)
    }
  }

  return (
    <section className="panel admin-panel">
      <div className="panel-heading split">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Times e fotos</h2>
        </div>
        <span className="admin-badge">
          <ShieldCheck size={16} aria-hidden="true" />
          Acesso liberado
        </span>
      </div>

      {error ? <p className="field-error admin-feedback">{error}</p> : null}
      {message ? <p className="success-message admin-feedback">{message}</p> : null}

      <div className="admin-team-list">
        {drafts.map((draft) => (
          <form className="admin-team-form" key={draft.id} onSubmit={(event) => handleSubmit(event, draft)}>
            <div className="admin-preview">
              <span className="photo-preview">
                {draft.photoUrl ? <img src={draft.photoUrl} alt="" /> : draft.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{draft.name}</strong>
                <span>{draft.teamName}</span>
              </div>
            </div>

            <label>
              <span>Jogador</span>
              <input
                aria-label={`Nome do jogador ${draft.initialName}`}
                value={draft.name}
                onChange={(event) => updateDraft(draft.id, { name: event.target.value })}
              />
            </label>

            <label>
              <span>Time</span>
              <input
                aria-label={`Time de ${draft.initialName}`}
                value={draft.teamName}
                onChange={(event) => updateDraft(draft.id, { teamName: event.target.value })}
              />
            </label>

            <label>
              <span>Escudo URL</span>
              <input
                aria-label={`Escudo de ${draft.initialName}`}
                type="url"
                value={draft.crestUrl}
                onChange={(event) => updateDraft(draft.id, { crestUrl: event.target.value })}
              />
            </label>

            <label className="file-control">
              <span>Foto</span>
              <input
                accept="image/*"
                aria-label={`Foto de ${draft.initialName}`}
                type="file"
                onChange={(event) => updateDraft(draft.id, { photoFile: event.target.files?.[0] ?? null })}
              />
              <span className="file-label">
                <ImagePlus size={16} aria-hidden="true" />
                {draft.photoFile?.name ?? 'Escolher foto'}
              </span>
            </label>

            {onSyncTeamRoster ? (
              <button
                className="sync-button"
                type="button"
                disabled={syncingPlayerId === draft.id || savingPlayerId === draft.id}
                onClick={() => handleSyncRoster(draft)}
              >
                <Download size={16} aria-hidden="true" />
                {syncingPlayerId === draft.id ? 'Buscando' : `Puxar elenco ${draft.initialName}`}
              </button>
            ) : null}

            <button className="save-button" type="submit" disabled={savingPlayerId === draft.id}>
              <Save size={16} aria-hidden="true" />
              {savingPlayerId === draft.id ? 'Salvando' : `Salvar ${draft.initialName}`}
            </button>
          </form>
        ))}
      </div>
    </section>
  )
}

function createDrafts(players: Player[]): PlayerDraft[] {
  return players.map((player) => ({ ...player, initialName: player.name, photoFile: null }))
}
