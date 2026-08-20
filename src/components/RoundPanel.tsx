import { CalendarDays, ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import { TOTAL_ROUNDS, getRoundStatus, type Match, type Player, type RoundStatus, type ScorerEntry } from '../domain/tournament'
import { cn } from '../lib/utils'
import { MatchEditor } from './MatchEditor'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type RoundPanelProps = {
  players: Player[]
  matches: Match[]
  roundMatches: Match[]
  byePlayer: Player | undefined
  selectedRound: number
  savingMatchId: string | null
  onRoundChange: (round: number) => void
  onSaveScore: (matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) => Promise<void>
}

const ROUND_STATUS_META: Record<RoundStatus, { label: string; dotClassName: string; badgeClassName: string }> = {
  not_started: {
    label: 'A iniciar',
    dotClassName: 'bg-muted-foreground/40',
    badgeClassName: 'border-border text-muted-foreground',
  },
  in_progress: {
    label: 'Em andamento',
    dotClassName: 'bg-brand-cyan',
    badgeClassName: 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-purple dark:text-primary',
  },
  finished: {
    label: 'Finalizada',
    dotClassName: 'bg-brand-lime',
    badgeClassName: 'border-brand-lime/50 bg-brand-lime/15 text-emerald-700 dark:text-emerald-300',
  },
}

export function RoundPanel({
  players,
  matches,
  roundMatches,
  byePlayer,
  selectedRound,
  savingMatchId,
  onRoundChange,
  onSaveScore,
}: RoundPanelProps) {
  const playerById = new Map(players.map((player) => [player.id, player]))
  const selectedRoundStatus = getRoundStatus(matches, selectedRound)
  const selectedStatusMeta = ROUND_STATUS_META[selectedRoundStatus]

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Partidas</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Rodada {selectedRound}</h2>
            <Badge variant="outline" className={cn('gap-1.5', selectedStatusMeta.badgeClassName)}>
              <span className={cn('size-1.5 rounded-full', selectedStatusMeta.dotClassName)} aria-hidden="true" />
              {selectedStatusMeta.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => onRoundChange(Math.max(1, selectedRound - 1))}
            title="Rodada anterior"
            aria-label="Rodada anterior"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </Button>
          <Select value={String(selectedRound)} onValueChange={(value) => onRoundChange(Number(value))}>
            <SelectTrigger aria-label="Selecionar rodada" className="w-32 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1).map((round) => {
                const roundStatus = getRoundStatus(matches, round)
                const statusMeta = ROUND_STATUS_META[roundStatus]

                return (
                  <SelectItem value={String(round)} key={round}>
                    <span className="flex items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', statusMeta.dotClassName)} aria-hidden="true" />
                      Rodada {round}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => onRoundChange(Math.min(TOTAL_ROUNDS, selectedRound + 1))}
            title="Proxima rodada"
            aria-label="Proxima rodada"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} aria-hidden="true" />
            {selectedRound <= TOTAL_ROUNDS / 2 ? 'Turno' : 'Returno'}
          </span>
          <span className="flex items-center gap-1.5">
            <Moon size={16} aria-hidden="true" />
            Folga: {byePlayer?.name ?? 'A definir'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
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
      </CardContent>
    </Card>
  )
}
