import { ChevronDown, HelpCircle, Trophy } from 'lucide-react'
import type { KnockoutMatch, Match, Player, ResolvedKnockoutBracket, ResolvedKnockoutMatch, ScorerEntry } from '../domain/tournament'
import { MatchEditor } from './MatchEditor'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'

type KnockoutBracketCardProps = {
  bracket: ResolvedKnockoutBracket
  savingMatchId: string | null
  onSaveScore: (matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) => Promise<void>
}

export function KnockoutBracketCard({ bracket, savingMatchId, onSaveScore }: KnockoutBracketCardProps) {
  return (
    <Card className="mt-6 gap-4 py-5">
      <CardHeader>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Mata-mata</p>
        <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Fase eliminatória</h2>
        <p className="text-xs text-muted-foreground">
          Baseado na classificação atual da fase de pontos corridos — pode mudar até o fim da fase de liga.
        </p>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-0">
          <div className="flex flex-col items-center gap-3 lg:justify-around lg:gap-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground/80 uppercase lg:hidden">
              Semifinais
            </p>
            <KnockoutMatchSlot resolved={bracket.sf1} savingMatchId={savingMatchId} onSaveScore={onSaveScore} />
            <KnockoutMatchSlot resolved={bracket.sf2} savingMatchId={savingMatchId} onSaveScore={onSaveScore} />
          </div>

          <KnockoutConnector variant="merge" />

          <div className="flex flex-col items-center gap-3 lg:justify-center">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground/80 uppercase lg:hidden">Final</p>
            <KnockoutMatchSlot resolved={bracket.final} savingMatchId={savingMatchId} onSaveScore={onSaveScore} />
          </div>

          <KnockoutConnector variant="line" />

          <div className="flex flex-col items-center gap-3 lg:justify-center">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground/80 uppercase lg:hidden">
              Grande final
            </p>
            <KnockoutMatchSlot
              resolved={bracket.grandFinal}
              savingMatchId={savingMatchId}
              onSaveScore={onSaveScore}
              homeBadge="Direto"
            />
          </div>

          <KnockoutConnector variant="line" />

          <div className="flex flex-col items-center gap-3 lg:justify-center">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground/80 uppercase lg:hidden">
              Campeão
            </p>
            <ChampionSlot champion={bracket.champion} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Conector decorativo entre fases (nao tem conteudo interativo, por isso pode
// ter uma versao para celular — seta — e outra para telas largas — linha de
// chave — alternadas via CSS, sem duplicar formularios de verdade.
function KnockoutConnector({ variant }: { variant: 'merge' | 'line' }) {
  return (
    <>
      <ChevronDown size={18} className="shrink-0 text-muted-foreground/40 lg:hidden" aria-hidden="true" />
      {variant === 'merge' ? (
        <div className="hidden w-10 shrink-0 text-border lg:flex" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0,25 H50 V50 M0,75 H50 V50 M50,50 H100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ) : (
        <div className="hidden w-10 shrink-0 items-center lg:flex" aria-hidden="true">
          <div className="h-0.5 w-full bg-border" />
        </div>
      )}
    </>
  )
}

function ChampionSlot({ champion }: { champion: Player | undefined }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-lg border border-brand-lime/50 bg-brand-lime/15 px-4 py-3.5 text-center sm:w-72">
      <Trophy size={22} className="text-brand-purple dark:text-primary" aria-hidden="true" />
      {champion ? (
        <span className="text-sm font-bold text-foreground">{champion.name}</span>
      ) : (
        <span className="text-sm font-semibold text-muted-foreground italic">A definir</span>
      )}
    </div>
  )
}

type KnockoutMatchSlotProps = {
  resolved: ResolvedKnockoutMatch
  savingMatchId: string | null
  onSaveScore: (matchId: string, homeGoals: number, awayGoals: number, scorers: ScorerEntry[]) => Promise<void>
  homeBadge?: string
}

// Cada fase so vira um formulario de placar quando os dois times ja sao
// conhecidos (seed direto ou vencedor da fase anterior); antes disso mostra
// so um resumo com "A definir" no lugar de quem ainda nao foi decidido.
function KnockoutMatchSlot({ resolved, savingMatchId, onSaveScore, homeBadge }: KnockoutMatchSlotProps) {
  const { home, away } = resolved

  if (home.player && away.player) {
    const match = toEditableMatch(resolved.match, home.player.id, away.player.id)

    return (
      <div className="w-full sm:w-72">
        <MatchEditor
          match={match}
          homePlayer={home.player}
          awayPlayer={away.player}
          saving={savingMatchId === resolved.stage}
          onSave={onSaveScore}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 sm:w-72">
      <KnockoutPlaceholderSlot seed={home.seed} player={home.player} label={home.label} badge={homeBadge} />
      <div className="h-px w-full bg-border" />
      <KnockoutPlaceholderSlot seed={away.seed} player={away.player} label={away.label} />
    </div>
  )
}

function toEditableMatch(knockoutMatch: KnockoutMatch, homePlayerId: string, awayPlayerId: string): Match {
  return {
    id: knockoutMatch.id,
    round: 0,
    leg: 'turno',
    homePlayerId,
    awayPlayerId,
    byePlayerId: '',
    homeGoals: knockoutMatch.homeGoals,
    awayGoals: knockoutMatch.awayGoals,
    played: knockoutMatch.played,
    scorers: knockoutMatch.scorers,
  }
}

function KnockoutPlaceholderSlot({
  seed,
  player,
  label,
  badge,
}: {
  seed?: number
  player?: Player
  label?: string
  badge?: string
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
          <HelpCircle size={12} aria-hidden="true" />
        </span>
        <span className="truncate text-sm text-muted-foreground italic">{label ?? 'A definir'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {typeof seed === 'number' ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted-foreground">
          {seed}
        </span>
      ) : null}
      <Avatar className="size-7 rounded-lg">
        <AvatarImage src={player.crestUrl || undefined} alt="" />
        <AvatarFallback className="rounded-lg bg-muted text-[10px] font-bold text-brand-purple dark:text-primary">
          {player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-semibold text-foreground">{player.name}</span>
      {badge ? (
        <span className="ml-auto shrink-0 rounded-full bg-brand-lime/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple dark:text-primary">
          {badge}
        </span>
      ) : null}
    </div>
  )
}
