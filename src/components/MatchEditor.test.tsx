import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultMatches, defaultPlayers } from '../domain/tournament'
import { MatchEditor } from './MatchEditor'

describe('MatchEditor', () => {
  it('resets score fields when the selected match changes', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const firstMatch = {
      ...defaultMatches[1],
      homeGoals: 2,
      awayGoals: 0,
      played: true,
    }
    const secondMatch = {
      ...defaultMatches[2],
      homeGoals: null,
      awayGoals: null,
      played: false,
    }

    const { rerender } = render(
      <MatchEditor
        match={firstMatch}
        homePlayer={defaultPlayers[2]}
        awayPlayer={defaultPlayers[3]}
        saving={false}
        onSave={onSave}
      />,
    )

    expect(screen.getByLabelText('Gols de Falcon')).toHaveValue(2)
    expect(screen.getByLabelText('Gols de Leo')).toHaveValue(0)

    rerender(
      <MatchEditor
        match={secondMatch}
        homePlayer={defaultPlayers[0]}
        awayPlayer={defaultPlayers[4]}
        saving={false}
        onSave={onSave}
      />,
    )

    expect(screen.getByLabelText('Gols de Capflint')).toHaveValue(null)
    expect(screen.getByLabelText('Gols de NSB')).toHaveValue(null)
  })

  it('offers squad player names for the selected scorer team', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const homePlayer = {
      ...defaultPlayers[2],
      squad: [{ id: 10, name: 'Ousmane Dembele', number: 10, position: 'Attacker', photo: '' }],
    }

    render(
      <MatchEditor
        match={defaultMatches[1]}
        homePlayer={homePlayer}
        awayPlayer={defaultPlayers[3]}
        saving={false}
        onSave={onSave}
      />,
    )

    await screen.findByText('Nenhum artilheiro informado.')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByText('Ousmane Dembele')).toBeInTheDocument()
  })
})
