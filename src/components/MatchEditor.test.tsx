import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultMatches, defaultPlayers } from '../domain/tournament'
import { MatchEditor } from './MatchEditor'

describe('MatchEditor', () => {
  it('resets score fields when the selected match changes', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const firstMatch = {
      ...defaultMatches[1],
      homeGoals: null,
      awayGoals: null,
      played: false,
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

    const falconInput = screen.getByLabelText('Gols de Falcon')
    fireEvent.change(falconInput, { target: { value: '2' } })
    expect(falconInput).toHaveValue(2)

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

  it('locks the score once the match has been played, showing a collapsed summary by default', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const playedMatch = {
      ...defaultMatches[1],
      homeGoals: 2,
      awayGoals: 0,
      played: true,
      scorers: [{ id: 's1', name: 'Mbappe', teamPlayerId: 'falcon', goals: 2 }],
    }

    render(
      <MatchEditor
        match={playedMatch}
        homePlayer={defaultPlayers[2]}
        awayPlayer={defaultPlayers[3]}
        saving={false}
        onSave={onSave}
      />,
    )

    expect(screen.queryByLabelText('Gols de Falcon')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Gols de Leo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: 'Ver detalhes da partida Falcon 2 x 0 Leo' })
    expect(screen.queryByText('Mbappe')).not.toBeInTheDocument()
    expect(screen.queryByText('Placar encerrado, nao pode ser editado')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(screen.getByText('Mbappe')).toBeInTheDocument()
    expect(screen.getByText('Placar encerrado, nao pode ser editado')).toBeInTheDocument()
  })

  it('keeps the scorer list collapsed by default to save vertical space', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const match = { ...defaultMatches[1], played: false }

    render(
      <MatchEditor match={match} homePlayer={defaultPlayers[2]} awayPlayer={defaultPlayers[3]} saving={false} onSave={onSave} />,
    )

    expect(screen.getByLabelText('Gols de Falcon')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum artilheiro informado.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Artilheiros' }))

    expect(screen.getByText('Nenhum artilheiro informado.')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Artilheiros' }))
    await screen.findByText('Nenhum artilheiro informado.')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    await user.click(screen.getByLabelText('Nome do artilheiro 1'))

    expect(await screen.findByText('Ousmane Dembele')).toBeInTheDocument()
  })
})
