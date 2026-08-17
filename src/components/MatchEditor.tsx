import { Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Match, Player } from '../domain/tournament'

type MatchEditorProps = {
  match: Match
  homePlayer: Player
  awayPlayer: Player
  saving: boolean
  onSave: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>
}

export function MatchEditor({ match, homePlayer, awayPlayer, saving, onSave }: MatchEditorProps) {
  const [homeGoals, setHomeGoals] = useState(match.homeGoals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match.awayGoals?.toString() ?? '')
  const [localError, setLocalError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedHomeGoals = Number(homeGoals)
    const parsedAwayGoals = Number(awayGoals)

    if (!Number.isInteger(parsedHomeGoals) || !Number.isInteger(parsedAwayGoals) || parsedHomeGoals < 0 || parsedAwayGoals < 0) {
      setLocalError('Use gols inteiros a partir de zero.')
      return
    }

    setLocalError('')
    await onSave(match.id, parsedHomeGoals, parsedAwayGoals)
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

      <button className="save-button" type="submit" disabled={saving}>
        <Save size={16} aria-hidden="true" />
        {saving ? 'Salvando' : match.played ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  )
}
