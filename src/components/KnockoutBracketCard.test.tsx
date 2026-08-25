import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { calculateStandings, defaultPlayers, resolveKnockoutBracket, type KnockoutMatch } from '../domain/tournament'
import { KnockoutBracketCard } from './KnockoutBracketCard'

// Sem partidas jogadas na fase de liga, a classificacao empata em pontos e
// desempata em ordem alfabetica: Capflint, Falcon, Leo, Manduca, NSB.
const standings = calculateStandings(defaultPlayers, [])

describe('KnockoutBracketCard', () => {
  it('lets the semifinals be edited right away, showing "A definir" for stages that still depend on a result', () => {
    const bracket = resolveKnockoutBracket(standings, [])
    const onSaveScore = vi.fn().mockResolvedValue(undefined)

    render(<KnockoutBracketCard bracket={bracket} savingMatchId={null} onSaveScore={onSaveScore} />)

    expect(screen.getByLabelText('Gols de Falcon')).toBeInTheDocument()
    expect(screen.getByLabelText('Gols de NSB')).toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Leo')).toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Manduca')).toBeInTheDocument()

    expect(screen.getByText('Vencedor SF1')).toBeInTheDocument()
    expect(screen.getByText('Vencedor SF2')).toBeInTheDocument()
    expect(screen.getByText('Vencedor da final')).toBeInTheDocument()
    expect(screen.getByText('Capflint')).toBeInTheDocument()
    expect(screen.getByText('Direto')).toBeInTheDocument()
    expect(screen.getByText('A definir')).toBeInTheDocument()
  })

  it('saves a semifinal score through the same score editor used for league matches', async () => {
    const bracket = resolveKnockoutBracket(standings, [])
    const onSaveScore = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<KnockoutBracketCard bracket={bracket} savingMatchId={null} onSaveScore={onSaveScore} />)

    await user.type(screen.getByLabelText('Gols de Falcon'), '2')
    await user.type(screen.getByLabelText('Gols de NSB'), '1')
    await user.click(screen.getAllByRole('button', { name: 'Salvar' })[0])

    expect(onSaveScore).toHaveBeenCalledWith('sf1', 2, 1, [])
  })

  it('shows the final matchup once both semifinals are decided', () => {
    const played: KnockoutMatch[] = [
      { id: 'sf1', homeGoals: 2, awayGoals: 1, played: true, scorers: [] },
      { id: 'sf2', homeGoals: 0, awayGoals: 3, played: true, scorers: [] },
    ]
    const bracket = resolveKnockoutBracket(standings, played)
    const onSaveScore = vi.fn().mockResolvedValue(undefined)

    render(<KnockoutBracketCard bracket={bracket} savingMatchId={null} onSaveScore={onSaveScore} />)

    expect(screen.getByLabelText('Gols de Falcon')).toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Manduca')).toBeInTheDocument()
    expect(screen.queryByText('Vencedor SF1')).not.toBeInTheDocument()
    expect(screen.queryByText('Vencedor SF2')).not.toBeInTheDocument()
  })

  it('shows the champion once the grand final has been played', () => {
    const played: KnockoutMatch[] = [
      { id: 'sf1', homeGoals: 2, awayGoals: 1, played: true, scorers: [] },
      { id: 'sf2', homeGoals: 0, awayGoals: 3, played: true, scorers: [] },
      { id: 'final', homeGoals: 1, awayGoals: 4, played: true, scorers: [] },
      { id: 'grandFinal', homeGoals: 2, awayGoals: 3, played: true, scorers: [] },
    ]
    const bracket = resolveKnockoutBracket(standings, played)
    const onSaveScore = vi.fn().mockResolvedValue(undefined)

    render(<KnockoutBracketCard bracket={bracket} savingMatchId={null} onSaveScore={onSaveScore} />)

    expect(screen.getAllByText('Manduca').length).toBeGreaterThan(0)
    expect(screen.queryByText('A definir')).not.toBeInTheDocument()
  })
})
