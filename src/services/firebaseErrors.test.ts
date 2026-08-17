import { describe, expect, it } from 'vitest'
import { getFirebaseAuthMessage } from './firebaseErrors'

describe('getFirebaseAuthMessage', () => {
  it('explains Firebase Auth configuration errors with the console action to take', () => {
    expect(getFirebaseAuthMessage({ code: 'auth/configuration-not-found' })).toBe(
      'Firebase Authentication ainda nao esta configurado neste projeto. No Console Firebase, abra Authentication > Sign-in method, habilite Google e salve.',
    )
  })

  it('keeps the original error message for unknown auth errors', () => {
    expect(getFirebaseAuthMessage(new Error('Popup fechado'))).toBe('Popup fechado')
  })
})
