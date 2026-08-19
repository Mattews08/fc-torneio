import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { Match, Player, ScorerEntry } from '../domain/tournament'

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
  const [homeGoals, setHomeGoals] = useState(match.homeGoals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match.awayGoals?.toString() ?? '')
  const [scorerDrafts, setScorerDrafts] = useState<ScorerDraft[]>(() => createScorerDrafts(match.scorers ?? [], homePlayer.id))
  const [localError, setLocalError] = useState('')

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
    <form className={match.played ? 'match-editor played' : 'match-editor'} onSubmit={handleSubmit}>
      <div className="match-teams">
        <strong>{homePlayer.name}</strong>
        <span>x</span>
        <strong>{awayPlayer.name}</strong>
      </div>

      <div className="score-inputs">
        <input
          aria-label={`Gols de ${homePlayer.name}`}
          min="0"
          type="number"
          value={homeGoals}
          onChange={(event) => setHomeGoals(event.target.value)}
        />
        <span>-</span>
        <input
          aria-label={`Gols de ${awayPlayer.name}`}
          min="0"
          type="number"
          value={awayGoals}
          onChange={(event) => setAwayGoals(event.target.value)}
        />
      </div>

      {localError ? <p className="field-error">{localError}</p> : null}

      <div className="scorer-editor">
        <div className="scorer-editor-heading">
          <strong>Artilheiros da partida</strong>
          <button className="mini-button" type="button" onClick={addScorerDraft}>
            <Plus size={15} aria-hidden="true" />
            Adicionar
          </button>
        </div>

        {scorerDrafts.length > 0 ? (
          <div className="scorer-drafts">
            {scorerDrafts.map((draft, index) => (
              <div className="scorer-draft-row" key={draft.id}>
                {(() => {
                  const datalistId = `scorer-options-${match.id}-${draft.id}`
                  const squadOptions = getSquadOptions(draft.teamPlayerId)

                  return (
                    <>
                <input
                  aria-label={`Nome do artilheiro ${index + 1}`}
                  list={datalistId}
                  placeholder="Nome"
                  value={draft.name}
                  onChange={(event) => updateScorerDraft(draft.id, { name: event.target.value })}
                />
                <datalist id={datalistId}>
                  {squadOptions.map((player) => (
                    <option value={player.name} key={player.id}>
                      {player.name}
                    </option>
                  ))}
                </datalist>
                <select
                  aria-label={`Time do artilheiro ${index + 1}`}
                  value={draft.teamPlayerId}
                  onChange={(event) => updateScorerDraft(draft.id, { teamPlayerId: event.target.value })}
                >
                  <option value={homePlayer.id}>{homePlayer.name}</option>
                  <option value={awayPlayer.id}>{awayPlayer.name}</option>
                </select>
                <input
                  aria-label={`Gols do artilheiro ${index + 1}`}
                  min="1"
                  type="number"
                  value={draft.goals}
                  onChange={(event) => updateScorerDraft(draft.id, { goals: event.target.value })}
                />
                <button className="icon-button remove-scorer-button" type="button" onClick={() => removeScorerDraft(draft.id)} title="Remover artilheiro">
                  <Trash2 size={15} aria-hidden="true" />
                </button>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-scorers">Nenhum artilheiro informado.</p>
        )}
      </div>

      <button className="save-button" type="submit" disabled={saving}>
        <Save size={16} aria-hidden="true" />
        {saving ? 'Salvando' : match.played ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
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
