import { Goal, Medal } from 'lucide-react'
import type { TopScorerRow } from '../domain/tournament'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

type TopScorersPageProps = {
  scorers: TopScorerRow[]
}

export function TopScorersPage({ scorers }: TopScorersPageProps) {
  return (
    <Card className="mt-6 gap-4 py-5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Artilheiros</p>
          <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Ranking de gols</h2>
        </div>
        <Badge className="gap-1.5 bg-brand-lime text-brand-purple">
          <Goal size={14} aria-hidden="true" />
          {scorers.reduce((total, scorer) => total + scorer.goals, 0)} gols
        </Badge>
      </CardHeader>

      <CardContent className="px-0">
        {scorers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Pos</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead className="text-center">Gols</TableHead>
                <TableHead className="pr-5 text-center">Jogos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scorers.map((scorer, index) => (
                <TableRow key={scorer.key}>
                  <TableCell className="pl-5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-brand-purple text-xs font-bold text-white">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong className="block leading-tight font-semibold text-foreground">{scorer.name}</strong>
                    <span className="text-xs text-muted-foreground">{scorer.teamName}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <strong className="text-base font-bold text-brand-purple dark:text-primary">{scorer.goals}</strong>{' '}
                    <span className="text-xs text-muted-foreground">{scorer.goals === 1 ? 'gol' : 'gols'}</span>
                  </TableCell>
                  <TableCell className="pr-5 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Medal size={14} aria-hidden="true" />
                      {scorer.matches}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-muted-foreground">
            <Goal size={28} aria-hidden="true" />
            <strong className="font-semibold text-foreground">Nenhum artilheiro cadastrado ainda.</strong>
            <span className="text-sm">
              Abra uma rodada, adicione os nomes dos goleadores da partida e salve o placar.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
