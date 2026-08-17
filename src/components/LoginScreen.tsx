import { Mail, Trophy } from 'lucide-react'

type LoginScreenProps = {
  error: string
  onSignIn: () => void
}

export function LoginScreen({ error, onSignIn }: LoginScreenProps) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <Trophy aria-hidden="true" />
        </div>
        <p className="eyebrow">FC Tournament</p>
        <h1>Gerencie o campeonato FIFA em pontos corridos.</h1>
        <p className="login-copy">
          Entre com o Gmail para abrir a tabela, lancar placares e acompanhar as rodadas do turno e returno.
        </p>
        {error ? <p className="alert">{error}</p> : null}
        <button className="primary-button" type="button" onClick={onSignIn}>
          <Mail size={18} aria-hidden="true" />
          Entrar com Google
        </button>
      </section>
    </main>
  )
}
