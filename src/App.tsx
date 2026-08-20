import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { Database, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminTeamsPanel } from './components/AdminTeamsPanel'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { RoundPanel } from './components/RoundPanel'
import { StandingsTable } from './components/StandingsTable'
import { TopScorersPage } from './components/TopScorersPage'
import type { AppView } from './components/Header'
import { Alert, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'
import { canManageTeams } from './domain/admin'
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 text-brand-purple dark:text-primary">
        <RefreshCw className="animate-spin" size={28} aria-hidden="true" />
        <span className="text-sm font-medium">Carregando Firebase</span>
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
  const isAdmin = canManageTeams(user.email)
  const [activeView, setActiveView] = useState<AppView>('dashboard')

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Header
        user={user}
        isAdmin={isAdmin}
        activeView={activeView}
        onViewChange={setActiveView}
        onSignOut={onSignOut}
      />

      {activeView === 'admin' && isAdmin ? (
        <AdminTeamsPanel
          players={tournament.players}
          onSavePlayer={tournament.savePlayer}
          onUploadPhoto={tournament.uploadPlayerPhoto}
          onSyncTeamRoster={tournament.syncTeamRoster}
        />
      ) : activeView === 'scorers' ? (
        <TopScorersPage scorers={tournament.topScorers} />
      ) : (
        <>
          {tournament.error ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{tournament.error}</AlertDescription>
            </Alert>
          ) : null}

          {tournament.loading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="animate-spin" size={18} aria-hidden="true" />
              Sincronizando dados
            </div>
          ) : null}

          {!tournament.isSeeded ? (
            <div className="mt-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-brand-lime/40 bg-success p-4 text-success-foreground">
              <div className="flex items-start gap-3">
                <Sparkles size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong className="block font-semibold">Primeiro acesso</strong>
                  <span>Clique em &quot;Criar tabela base&quot; para gravar jogadores e partidas no Firestore.</span>
                </div>
              </div>
              <Button variant="cyan" size="sm" type="button" onClick={tournament.seedTournament}>
                <Database aria-hidden="true" />
                Criar tabela base
              </Button>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StandingsTable standings={tournament.standings} />
            <RoundPanel
              players={tournament.players}
              matches={tournament.matches}
              roundMatches={tournament.roundMatches}
              byePlayer={tournament.byePlayer}
              selectedRound={tournament.selectedRound}
              savingMatchId={tournament.savingMatchId}
              onRoundChange={tournament.setSelectedRound}
              onSaveScore={tournament.saveScore}
            />
          </div>
        </>
      )}
    </main>
  )
}
