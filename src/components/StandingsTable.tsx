import { Trophy } from 'lucide-react'
import type { StandingRow } from '../domain/tournament'
import { cn } from '../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

type StandingsTableProps = {
  standings: StandingRow[]
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Classificação</p>
        <h2 className="text-lg font-bold text-brand-purple dark:text-primary">Tabela geral</h2>
      </CardHeader>

      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Pos</TableHead>
              <TableHead>Clube</TableHead>
              <TableHead className="hidden text-center sm:table-cell">J</TableHead>
              <TableHead className="hidden text-center md:table-cell">V</TableHead>
              <TableHead className="hidden text-center md:table-cell">E</TableHead>
              <TableHead className="hidden text-center md:table-cell">D</TableHead>
              <TableHead className="hidden text-center lg:table-cell">GP</TableHead>
              <TableHead className="hidden text-center lg:table-cell">GC</TableHead>
              <TableHead className="text-center">SG</TableHead>
              <TableHead className="pr-5 text-center">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, index) => {
              const isLeader = index === 0

              return (
                <TableRow
                  key={row.playerId}
                  className={cn(index % 2 === 1 && 'bg-muted/30', isLeader && 'bg-brand-lime/10 hover:bg-brand-lime/15')}
                >
                  <TableCell className="pl-5">
                    {isLeader ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-brand-lime text-brand-purple">
                        <Trophy size={14} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full border border-border text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-9 rounded-lg">
                        <AvatarImage src={row.player.crestUrl || undefined} alt="" />
                        <AvatarFallback className="rounded-lg bg-muted text-xs font-bold text-brand-purple dark:text-primary">
                          {row.player.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <strong className="block leading-tight font-semibold text-foreground">
                          {row.player.name}
                        </strong>
                        <span className="text-xs text-muted-foreground">{row.player.teamName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-center text-muted-foreground sm:table-cell">{row.played}</TableCell>
                  <TableCell className="hidden text-center text-muted-foreground md:table-cell">{row.wins}</TableCell>
                  <TableCell className="hidden text-center text-muted-foreground md:table-cell">{row.draws}</TableCell>
                  <TableCell className="hidden text-center text-muted-foreground md:table-cell">{row.losses}</TableCell>
                  <TableCell className="hidden text-center text-muted-foreground lg:table-cell">{row.goalsFor}</TableCell>
                  <TableCell className="hidden text-center text-muted-foreground lg:table-cell">{row.goalsAgainst}</TableCell>
                  <TableCell
                    className={cn(
                      'text-center font-medium',
                      row.goalDifference > 0 && 'text-emerald-600 dark:text-emerald-400',
                      row.goalDifference < 0 && 'text-destructive',
                    )}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </TableCell>
                  <TableCell className="pr-5 text-center">
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-brand-purple px-2.5 py-1 text-sm font-bold text-white">
                      {row.points}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
