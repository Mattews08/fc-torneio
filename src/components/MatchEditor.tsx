import { ChevronDown, Lock, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { Match, Player, ScorerEntry, SquadPlayer } from '../domain/tournament'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command'
import { Input } from './ui/input'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type MatchEditorProps = {
  match: Match
  homePlayer: Player
  awayPlayer: Player
  saving: boolean
  onSave: (matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) => Promise<void>
}

type ScorerDraft = {
  id: string
  name: string
  teamPlayerId: string
  goals: string
}

export function MatchEditor({ match, homePlayer, awayPlayer, saving, onSave }: MatchEditorProps) {
  if (match.played) {
    return <LockedMatchCard match={match} homePlayer={homePlayer} awayPlayer={awayPlayer} />
  }

  return (
    <EditableMatchForm match={match} homePlayer={homePlayer} awayPlayer={awayPlayer} saving={saving} onSave={onSave} />
  )
}

type LockedMatchCardProps = {
  match: Match
  homePlayer: Player
  awayPlayer: Player
}

function LockedMatchCard({ match, homePlayer, awayPlayer }: LockedMatchCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasScorers = Boolean(match.scorers && match.scorers.length > 0)

  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left"
        aria-expanded={expanded}
        aria-label={`Ver detalhes da partida ${homePlayer.name} ${match.homeGoals} x ${match.awayGoals} ${awayPlayer.name}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <Lock size={12} className="shrink-0 text-muted-foreground" aria-hidden="true" />

        <span className="flex flex-1 items-center justify-center gap-2 text-sm">
          <span className="truncate font-medium text-foreground">{homePlayer.name}</span>
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-bold text-brand-purple">
            {match.homeGoals} - {match.awayGoals}
          </span>
          <span className="truncate font-medium text-foreground">{awayPlayer.name}</span>
        </span>

        <ChevronDown
          size={15}
          className={cn('shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-border/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Artilheiros da partida
            </strong>
            <span className="text-xs text-muted-foreground">Placar encerrado, nao pode ser editado</span>
          </div>

          {hasScorers ? (
            <ul className="flex flex-col gap-1.5">
              {match.scorers?.map((scorer) => (
                <li key={scorer.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{scorer.name}</span>
                  <span className="text-muted-foreground">
                    {scorer.teamPlayerId === homePlayer.id ? homePlayer.name : awayPlayer.name} · {scorer.goals}{' '}
                    {scorer.goals === 1 ? 'gol' : 'gols'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum artilheiro informado.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

type EditableMatchFormProps = MatchEditorProps

function EditableMatchForm({ match, homePlayer, awayPlayer, saving, onSave }: EditableMatchFormProps) {
  const [homeGoals, setHomeGoals] = useState(match.homeGoals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match.awayGoals?.toString() ?? '')
  const [scorerDrafts, setScorerDrafts] = useState<ScorerDraft[]>(() => createScorerDrafts(match.scorers ?? [], homePlayer.id))
  const [localError, setLocalError] = useState('')
  const [scorersExpanded, setScorersExpanded] = useState(false)

  useEffect(() => {
    setHomeGoals(match.homeGoals?.toString() ?? '')
    setAwayGoals(match.awayGoals?.toString() ?? '')
    setScorerDrafts(createScorerDrafts(match.scorers ?? [], homePlayer.id))
    setLocalError('')
  }, [awayPlayer.id, homePlayer.id, match.awayGoals, match.homeGoals, match.id, match.scorers])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedHomeGoals = Number(homeGoals)
    const parsedAwayGoals = Number(awayGoals)
    const parsedScorers = parseScorers(scorerDrafts)

    if (!Number.isInteger(parsedHomeGoals) || !Number.isInteger(parsedAwayGoals) || parsedHomeGoals < 0 || parsedAwayGoals < 0) {
      setLocalError('Use gols inteiros a partir de zero.')
      return
    }

    if (!parsedScorers.valid) {
      setLocalError('Preencha nome e gols inteiros positivos para cada artilheiro.')
      return
    }

    setLocalError('')
    await onSave(match.id, parsedHomeGoals, parsedAwayGoals, parsedScorers.scorers)
  }

  function updateScorerDraft(scorerId: string, updates: Partial<ScorerDraft>) {
    setScorerDrafts((drafts) => drafts.map((draft) => (draft.id === scorerId ? { ...draft, ...updates } : draft)))
  }

  function addScorerDraft() {
    setScorerDrafts((drafts) => [
      ...drafts,
      {
        id: `draft-${crypto.randomUUID?.() ?? Date.now().toString()}`,
        name: '',
        teamPlayerId: homePlayer.id,
        goals: '1',
      },
    ])
  }

  function removeScorerDraft(scorerId: string) {
    setScorerDrafts((drafts) => drafts.filter((draft) => draft.id !== scorerId))
  }

  const filledScorerCount = scorerDrafts.filter((draft) => draft.name.trim() || draft.goals.trim()).length

  return (
    <form className="rounded-xl border border-border/70 bg-card" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 px-3.5 py-2.5">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="truncate font-medium text-foreground">{homePlayer.name}</span>
          <Input
            aria-label={`Gols de ${homePlayer.name}`}
            className="h-7 w-11 px-1 text-center text-sm font-bold"
            min="0"
            type="number"
            value={homeGoals}
            onChange={(event) => setHomeGoals(event.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            aria-label={`Gols de ${awayPlayer.name}`}
            className="h-7 w-11 px-1 text-center text-sm font-bold"
            min="0"
            type="number"
            value={awayGoals}
            onChange={(event) => setAwayGoals(event.target.value)}
          />
          <span className="truncate font-medium text-foreground">{awayPlayer.name}</span>
        </div>

        <div className="flex justify-end">
          <Button variant="cyan" size="sm" type="submit" disabled={saving}>
            <Save size={14} aria-hidden="true" />
            {saving ? 'Salvando' : 'Salvar'}
          </Button>
        </div>
      </div>

      {localError ? <p className="px-3.5 pb-2 text-center text-xs font-medium text-destructive">{localError}</p> : null}

      <div className="border-t border-border/70">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left"
          aria-expanded={scorersExpanded}
          onClick={() => setScorersExpanded((value) => !value)}
        >
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Artilheiros{filledScorerCount > 0 ? ` · ${filledScorerCount}` : ''}
          </span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-muted-foreground transition-transform', scorersExpanded && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {scorersExpanded ? (
          <div className="px-3.5 pb-3.5">
            <ScorerFieldsEditor
              scorerDrafts={scorerDrafts}
              homePlayer={homePlayer}
              awayPlayer={awayPlayer}
              onAddScorer={addScorerDraft}
              onUpdateScorer={updateScorerDraft}
              onRemoveScorer={removeScorerDraft}
            />
          </div>
        ) : null}
      </div>
    </form>
  )
}

type ScorerFieldsEditorProps = {
  scorerDrafts: ScorerDraft[]
  homePlayer: Player
  awayPlayer: Player
  onAddScorer: () => void
  onUpdateScorer: (scorerId: string, updates: Partial<ScorerDraft>) => void
  onRemoveScorer: (scorerId: string) => void
}

function ScorerFieldsEditor({
  scorerDrafts,
  homePlayer,
  awayPlayer,
  onAddScorer,
  onUpdateScorer,
  onRemoveScorer,
}: ScorerFieldsEditorProps) {
  function getSquadOptions(teamPlayerId: string) {
    if (teamPlayerId === homePlayer.id) {
      return homePlayer.squad ?? []
    }

    if (teamPlayerId === awayPlayer.id) {
      return awayPlayer.squad ?? []
    }

    return []
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" type="button" onClick={onAddScorer}>
          <Plus size={15} aria-hidden="true" />
          Adicionar
        </Button>
      </div>

      {scorerDrafts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {scorerDrafts.map((draft, index) => {
            const squadOptions = getSquadOptions(draft.teamPlayerId)

            return (
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1.5" key={draft.id}>
                <ScorerNameField
                  label={`Nome do artilheiro ${index + 1}`}
                  value={draft.name}
                  options={squadOptions}
                  onChange={(name) => onUpdateScorer(draft.id, { name })}
                />
                <Select
                  value={draft.teamPlayerId}
                  onValueChange={(value) => onUpdateScorer(draft.id, { teamPlayerId: value })}
                >
                  <SelectTrigger aria-label={`Time do artilheiro ${index + 1}`} className="w-28" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={homePlayer.id}>{homePlayer.name}</SelectItem>
                    <SelectItem value={awayPlayer.id}>{awayPlayer.name}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  aria-label={`Gols do artilheiro ${index + 1}`}
                  className="w-14 text-center"
                  min="1"
                  type="number"
                  value={draft.goals}
                  onChange={(event) => onUpdateScorer(draft.id, { goals: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => onRemoveScorer(draft.id)}
                  title="Remover artilheiro"
                  aria-label={`Remover artilheiro ${index + 1}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum artilheiro informado.</p>
      )}
    </div>
  )
}

type ScorerNameFieldProps = {
  label: string
  value: string
  options: SquadPlayer[]
  onChange: (name: string) => void
}

function ScorerNameField({ label, value, options, onChange }: ScorerNameFieldProps) {
  const [open, setOpen] = useState(false)
  const filteredOptions = options.filter((player) => player.name.toLowerCase().includes(value.trim().toLowerCase()))

  return (
    <Popover open={open && options.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          aria-label={label}
          autoComplete="off"
          placeholder="Nome"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[220px] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.name}
                  onSelect={() => {
                    onChange(player.name)
                    setOpen(false)
                  }}
                >
                  {player.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function createScorerDrafts(scorers: ScorerEntry[], defaultTeamPlayerId: string): ScorerDraft[] {
  return scorers.map((scorer) => ({
    id: scorer.id,
    name: scorer.name,
    teamPlayerId: scorer.teamPlayerId || defaultTeamPlayerId,
    goals: scorer.goals.toString(),
  }))
}

function parseScorers(drafts: ScorerDraft[]): { valid: true; scorers: ScorerEntry[] } | { valid: false } {
  const scorers: ScorerEntry[] = []

  for (const draft of drafts) {
    const name = draft.name.trim()
    const goals = Number(draft.goals)

    if (!name && !draft.goals.trim()) {
      continue
    }

    if (!name || !Number.isInteger(goals) || goals <= 0) {
      return { valid: false }
    }

    scorers.push({
      id: draft.id,
      name,
      teamPlayerId: draft.teamPlayerId,
      goals,
    })
  }

  return { valid: true, scorers }
}
