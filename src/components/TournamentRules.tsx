import { AlarmClockOff, Clock, ListOrdered, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/card'

const RULES = [
  {
    icon: Clock,
    title: 'Fase de liga',
    description: 'Partidas de 7 minutos.',
  },
  {
    icon: Trophy,
    title: 'Semifinal e final',
    description: 'Partidas de 10 minutos.',
  },
  {
    icon: AlarmClockOff,
    title: 'Atraso',
    description: 'Atraso de 10 minutos e WO (vitoria por ausencia do adversario).',
  },
  {
    icon: ListOrdered,
    title: 'Ordem das rodadas',
    description: 'Uma rodada precisa ser finalizada antes de abrir a proxima.',
  },
]

export function TournamentRules() {
  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Campeonato</p>
        <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Regras</h2>
      </CardHeader>

      <CardContent>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RULES.map((rule) => (
            <li key={rule.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple dark:bg-primary/10 dark:text-primary">
                <rule.icon size={18} aria-hidden="true" />
              </span>
              <div className="text-sm">
                <strong className="block font-semibold text-foreground">{rule.title}</strong>
                <span className="text-muted-foreground">{rule.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
