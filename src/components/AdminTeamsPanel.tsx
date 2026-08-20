import { Download, ImagePlus, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { Player } from '../domain/tournament'
import type { SyncedTeamRoster } from '../services/apiFootball'
import { Alert, AlertDescription } from './ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

type AdminTeamsPanelProps = {
  players: Player[]
  onSavePlayer: (player: Player) => Promise<void>
  onUploadPhoto: (playerId: string, file: File) => Promise<string>
  onSyncTeamRoster?: (teamName: string, teamId?: number) => Promise<SyncedTeamRoster>
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
      setError('Preencha o time antes de puxar dados.')
      return
    }

    setSyncingPlayerId(draft.id)

    try {
      const synced = await onSyncTeamRoster(draft.teamName.trim(), draft.apiFootballTeamId)
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
      setError(syncError instanceof Error ? syncError.message : 'Nao foi possivel puxar os dados do time.')
    } finally {
      setSyncingPlayerId(null)
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Admin</p>
          <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Times e fotos</h2>
        </div>
        <Badge className="gap-1.5 bg-brand-lime text-brand-purple">
          <ShieldCheck size={14} aria-hidden="true" />
          Acesso liberado
        </Badge>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {drafts.map((draft) => (
          <Card key={draft.id} className="gap-4 py-5">
            <CardHeader>
              <form
                className="flex flex-col gap-3.5"
                id={`admin-team-form-${draft.id}`}
                onSubmit={(event) => handleSubmit(event, draft)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-lg">
                    <AvatarImage src={draft.photoUrl || undefined} alt="" />
                    <AvatarFallback className="rounded-lg bg-muted text-sm font-bold text-brand-purple dark:text-primary">
                      {draft.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <strong className="block font-semibold text-foreground">{draft.name}</strong>
                    <span className="text-sm text-muted-foreground">{draft.teamName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Jogador</Label>
                    <Input
                      aria-label={`Nome do jogador ${draft.initialName}`}
                      value={draft.name}
                      onChange={(event) => updateDraft(draft.id, { name: event.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Time</Label>
                    <Input
                      aria-label={`Time de ${draft.initialName}`}
                      value={draft.teamName}
                      onChange={(event) => updateDraft(draft.id, { teamName: event.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Escudo URL</Label>
                    <Input
                      aria-label={`Escudo de ${draft.initialName}`}
                      type="url"
                      value={draft.crestUrl}
                      onChange={(event) => updateDraft(draft.id, { crestUrl: event.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>ID API-Futebol</Label>
                    <Input
                      aria-label={`ID API-Futebol de ${draft.initialName}`}
                      min="1"
                      type="number"
                      value={draft.apiFootballTeamId ?? ''}
                      onChange={(event) =>
                        updateDraft(draft.id, {
                          apiFootballTeamId: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Foto</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
                    <Input
                      accept="image/*"
                      aria-label={`Foto de ${draft.initialName}`}
                      type="file"
                      className="hidden"
                      onChange={(event) => updateDraft(draft.id, { photoFile: event.target.files?.[0] ?? null })}
                    />
                    <ImagePlus size={16} aria-hidden="true" />
                    {draft.photoFile?.name ?? 'Escolher foto'}
                  </label>
                </div>
              </form>
            </CardHeader>

            <CardContent className="flex flex-col gap-2">
              {onSyncTeamRoster ? (
                <Button
                  variant="outline"
                  type="button"
                  disabled={syncingPlayerId === draft.id || savingPlayerId === draft.id}
                  onClick={() => handleSyncRoster(draft)}
                >
                  <Download size={16} aria-hidden="true" />
                  {syncingPlayerId === draft.id ? 'Buscando' : `Puxar dados ${draft.initialName}`}
                </Button>
              ) : null}

              <Button
                variant="cyan"
                type="submit"
                form={`admin-team-form-${draft.id}`}
                disabled={savingPlayerId === draft.id}
              >
                <Save size={16} aria-hidden="true" />
                {savingPlayerId === draft.id ? 'Salvando' : `Salvar ${draft.initialName}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function createDrafts(players: Player[]): PlayerDraft[] {
  return players.map((player) => ({ ...player, initialName: player.name, photoFile: null }))
}
