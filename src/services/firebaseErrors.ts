type FirebaseLikeError = {
  code?: string
  message?: string
}

export function getFirebaseAuthMessage(error: unknown) {
  const firebaseError = error as FirebaseLikeError

  if (firebaseError.code === 'auth/configuration-not-found') {
    return 'Firebase Authentication ainda nao esta configurado neste projeto. No Console Firebase, abra Authentication > Sign-in method, habilite Google e salve.'
  }

  if (firebaseError.code === 'auth/operation-not-allowed') {
    return 'O login com Google nao esta habilitado no Firebase. Ative Google em Authentication > Sign-in method.'
  }

  if (firebaseError.code === 'auth/unauthorized-domain') {
    return 'Este dominio nao esta autorizado no Firebase Auth. Adicione localhost em Authentication > Settings > Authorized domains.'
  }

  return firebaseError.message ?? 'Nao foi possivel entrar com Google.'
}
