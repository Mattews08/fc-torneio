import { CalendarDays, ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import type { Match, Player } from '../domain/tournament'
import { MatchEditor } from './MatchEditor'

type RoundPanelProps = {
  players: Player[]
  roundMatches: Match[]
  byePlayer: Player | undefined
  selectedRound: number
  savingMatchId: string | null
  onRoundChange: (round: number) => void
  onSaveScore: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>
}

export function RoundPanel({
  players,
  roundMatches,
  byePlayer,
  selectedRound,
  savingMatchId,
  onRoundChange,
  onSaveScore,
}: RoundPanelProps) {
  const playerById = new Map(players.map((player) => [player.id, player]))

  return (
    <section className="panel round-panel">
      <div className="panel-heading split">
        <div>
          <p className="eyebrow">Partidas</p>
          <h2>Rodada {selectedRound}</h2>
        </div>
        <div className="round-controls">
          <button className="icon-button" type="button" onClick={() => onRoundChange(Math.max(1, selectedRound - 1))} title="Rodada anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <select value={selectedRound} onChange={(event) => onRoundChange(Number(event.target.value))} aria-label="Selecionar rodada">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((round) => (
              <option value={round} key={round}>
                Rodada {round}
              </option>
            ))}
          </select>
          <button className="icon-button" type="button" onClick={() => onRoundChange(Math.min(10, selectedRound + 1))} title="Proxima rodada">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="round-meta">
        <span>
          <CalendarDays size={16} aria-hidden="true" />
          {selectedRound <= 5 ? 'Turno' : 'Returno'}
        </span>
        <span>
          <Moon size={16} aria-hidden="true" />
          Folga: {byePlayer?.name ?? 'A definir'}
        </span>
      </div>

      <div className="match-list">
        {roundMatches.map((match) => {
          const homePlayer = playerById.get(match.homePlayerId)
          const awayPlayer = playerById.get(match.awayPlayerId)

          if (!homePlayer || !awayPlayer) {
            return null
          }

          return (
            <MatchEditor
              key={match.id}
              match={match}
              homePlayer={homePlayer}
              awayPlayer={awayPlayer}
              saving={savingMatchId === match.id}
              onSave={onSaveScore}
            />
          )
        })}
      </div>
    </section>
  )
}
