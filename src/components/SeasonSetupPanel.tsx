import { Dices, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Player } from '../domain/tournament'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

type SeasonSetupPanelProps = {
  suggestedName: string
  creating: boolean
  onCreateSeason: (name: string, rounds: number, players: Player[]) => Promise<void>
}

type PlayerRow = {
  rowId: string
  name: string
  teamName: string
  crestUrl: string
}

function createPlayerId() {
  return crypto.randomUUID?.() ?? `player-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emptyRow(): PlayerRow {
  return { rowId: createPlayerId(), name: '', teamName: '', crestUrl: '' }
}

export function SeasonSetupPanel({ suggestedName, creating, onCreateSeason }: SeasonSetupPanelProps) {
  const [name, setName] = useState(suggestedName)
  const [rounds, setRounds] = useState(10)
  const [rows, setRows] = useState<PlayerRow[]>([emptyRow(), emptyRow()])
  const [error, setError] = useState('')

  function updateRow(rowId: string, updates: Partial<PlayerRow>) {
    setRows((currentRows) => currentRows.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)))
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, emptyRow()])
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => (currentRows.length <= 2 ? currentRows : currentRows.filter((row) => row.rowId !== rowId)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const validRows = rows.filter((row) => row.name.trim() && row.teamName.trim())

    if (!trimmedName) {
      setError('De um nome pra temporada.')
      return
    }

    if (rounds < 1) {
      setError('A temporada precisa de pelo menos 1 rodada.')
      return
    }

    if (validRows.length < 2) {
      setError('Cadastre pelo menos 2 jogadores com nome e time.')
      return
    }

    const players: Player[] = validRows.map((row) => ({
      id: createPlayerId(),
      name: row.name.trim(),
      teamName: row.teamName.trim(),
      crestUrl: row.crestUrl.trim(),
      photoUrl: '',
    }))

    await onCreateSeason(trimmedName, rounds, players)
  }

  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Admin</p>
          <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Nova temporada</h2>
        </div>
      </CardHeader>

      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nome da temporada</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Nome da temporada" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Numero de rodadas</Label>
              <Input
                type="number"
                min="1"
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value) || 1)}
                aria-label="Numero de rodadas"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold text-foreground">
                Jogadores <Badge variant="outline">{rows.filter((row) => row.name.trim() && row.teamName.trim()).length}</Badge>
              </Label>
              <Button variant="outline" size="sm" type="button" onClick={addRow}>
                <Plus size={16} aria-hidden="true" />
                Adicionar jogador
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {rows.map((row, index) => (
                <div key={row.rowId} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={row.name}
                      placeholder={`Jogador ${index + 1}`}
                      onChange={(event) => updateRow(row.rowId, { name: event.target.value })}
                      aria-label={`Nome do jogador ${index + 1}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Time</Label>
                    <Input
                      value={row.teamName}
                      placeholder="Time"
                      onChange={(event) => updateRow(row.rowId, { teamName: event.target.value })}
                      aria-label={`Time do jogador ${index + 1}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Escudo URL</Label>
                    <Input
                      type="url"
                      value={row.crestUrl}
                      placeholder="Opcional"
                      onChange={(event) => updateRow(row.rowId, { crestUrl: event.target.value })}
                      aria-label={`Escudo do jogador ${index + 1}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={rows.length <= 2}
                    onClick={() => removeRow(row.rowId)}
                    title="Remover jogador"
                    aria-label={`Remover jogador ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button variant="cyan" type="submit" disabled={creating} className="self-start">
            <Dices size={16} aria-hidden="true" />
            {creating ? 'Sorteando' : 'Sortear confrontos e criar temporada'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
