import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Player } from '../domain/tournament'
import { AdminTeamsPanel } from './AdminTeamsPanel'

const players: Player[] = [
  {
    id: 'capflint',
    name: 'Capflint',
    teamName: 'Time Capflint',
    crestUrl: '',
    photoUrl: '',
  },
]

describe('AdminTeamsPanel', () => {
  it('saves edited team details', async () => {
    const savePlayer = vi.fn().mockResolvedValue(undefined)
    const uploadPhoto = vi.fn().mockResolvedValue('https://cdn.example.com/capflint.png')
    const user = userEvent.setup()

    render(<AdminTeamsPanel players={players} onSavePlayer={savePlayer} onUploadPhoto={uploadPhoto} />)

    await user.clear(screen.getByLabelText('Nome do jogador Capflint'))
    await user.type(screen.getByLabelText('Nome do jogador Capflint'), 'Mattheus')
    await user.clear(screen.getByLabelText('Time de Capflint'))
    await user.type(screen.getByLabelText('Time de Capflint'), 'Real Mattheus')
    await user.type(screen.getByLabelText('Escudo de Capflint'), 'https://cdn.example.com/crest.png')
    await user.upload(
      screen.getByLabelText('Foto de Capflint'),
      new File(['avatar'], 'avatar.png', { type: 'image/png' }),
    )
    await user.click(screen.getByRole('button', { name: 'Salvar Capflint' }))

    expect(uploadPhoto).toHaveBeenCalledWith('capflint', expect.any(File))
    expect(savePlayer).toHaveBeenCalledWith({
      id: 'capflint',
      name: 'Mattheus',
      teamName: 'Real Mattheus',
      crestUrl: 'https://cdn.example.com/crest.png',
      photoUrl: 'https://cdn.example.com/capflint.png',
    })
  })
})
