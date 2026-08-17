import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { Database, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { RoundPanel } from './components/RoundPanel'
import { StandingsTable } from './components/StandingsTable'
import { useTournament } from './hooks/useTournament'
import { auth, googleProvider } from './services/firebase'
import { getFirebaseAuthMessage } from './services/firebaseErrors'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthReady(true)
    })
  }, [])

  async function handleSignIn() {
    setAuthError('')

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setAuthError(getFirebaseAuthMessage(error))
    }
  }

  async function handleSignOut() {
    await signOut(auth)
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <RefreshCw className="spin" size={28} aria-hidden="true" />
        <span>Carregando Firebase</span>
      </main>
    )
  }

  if (!user) {
    return <LoginScreen error={authError} onSignIn={handleSignIn} />
  }

  return <Dashboard user={user} onSignOut={handleSignOut} />
}

type DashboardProps = {
  user: User
  onSignOut: () => void
}

function Dashboard({ user, onSignOut }: DashboardProps) {
  const tournament = useTournament(user.uid)

  return (
    <main className="app-shell">
      <Header user={user} onSignOut={onSignOut} />

      <section className="summary-band">
        <div>
          <p className="eyebrow">MVP Firebase</p>
          <h2>Tabela compartilhada em tempo real</h2>
        </div>
        <button className="secondary-button" type="button" onClick={tournament.seedTournament}>
          <Database size={18} aria-hidden="true" />
          {tournament.isSeeded ? 'Recarregar tabela base' : 'Criar tabela base'}
        </button>
      </section>

      {tournament.error ? <p className="alert">{tournament.error}</p> : null}
      {tournament.loading ? (
        <div className="loading-inline">
          <RefreshCw className="spin" size={18} aria-hidden="true" />
          Sincronizando dados
        </div>
      ) : null}

      {!tournament.isSeeded ? (
        <section className="seed-callout">
          <Sparkles size={20} aria-hidden="true" />
          <div>
            <strong>Primeiro acesso</strong>
            <span>Clique em "Criar tabela base" para gravar jogadores e partidas no Firestore.</span>
          </div>
        </section>
      ) : null}

      <div className="dashboard-grid">
        <StandingsTable standings={tournament.standings} />
        <RoundPanel
          players={tournament.players}
          roundMatches={tournament.roundMatches}
          byePlayer={tournament.byePlayer}
          selectedRound={tournament.selectedRound}
          savingMatchId={tournament.savingMatchId}
          onRoundChange={tournament.setSelectedRound}
          onSaveScore={tournament.saveScore}
        />
      </div>
    </main>
  )
}
