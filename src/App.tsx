import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { Dices, History, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminTeamsPanel } from './components/AdminTeamsPanel'
import { Header } from './components/Header'
import { KnockoutBracketCard } from './components/KnockoutBracketCard'
import { LoginScreen } from './components/LoginScreen'
import { RoundPanel } from './components/RoundPanel'
import { SeasonSetupPanel } from './components/SeasonSetupPanel'
import { StandingsTable } from './components/StandingsTable'
import { TopScorersPage } from './components/TopScorersPage'
import { TournamentRules } from './components/TournamentRules'
import type { AppView } from './components/Header'
import { Alert, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'
import { canManageTeams } from './domain/admin'
import { useSeasons } from './hooks/useSeasons'
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
  const isAdmin = canManageTeams(user.email)
  const seasons = useSeasons(user.uid)
  const tournament = useTournament(user.uid, seasons.selectedSeason)
  const [activeView, setActiveView] = useState<AppView>('dashboard')

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Header
        user={user}
        isAdmin={isAdmin}
        activeView={activeView}
        onViewChange={setActiveView}
        onSignOut={onSignOut}
        seasons={seasons.seasons}
        selectedSeasonId={seasons.selectedSeasonId}
        onSeasonChange={seasons.setSelectedSeasonId}
      />

      {seasons.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{seasons.error}</AlertDescription>
        </Alert>
      ) : null}

      {isAdmin && seasons.showMigrationBanner ? (
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-brand-lime/40 bg-success p-4 text-success-foreground">
          <div className="flex items-start gap-3">
            <History size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <strong className="block font-semibold">Temporada atual</strong>
              <span>Clique em &quot;Migrar dados atuais&quot; pra transformar a tabela e o mata-mata de agora na &quot;Temporada 1&quot;.</span>
            </div>
          </div>
          <Button variant="cyan" size="sm" type="button" disabled={seasons.migrating} onClick={seasons.migrateLegacySeason}>
            <History aria-hidden="true" />
            {seasons.migrating ? 'Migrando' : 'Migrar dados atuais'}
          </Button>
        </div>
      ) : null}

      {!seasons.loading && seasons.seasons.length === 0 && !seasons.showMigrationBanner ? (
        <Alert className="mt-6">
          <AlertDescription>
            {isAdmin
              ? 'Nenhuma temporada criada ainda. Use a aba "Nova temporada" para cadastrar os jogadores e sortear os confrontos.'
              : 'Nenhuma temporada criada ainda. Peca para o admin criar a primeira temporada.'}
          </AlertDescription>
        </Alert>
      ) : null}

      {isAdmin && !tournament.loading && tournament.matches.length > 0 && tournament.matches.every((match) => !match.played) ? (
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <Dices size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-purple dark:text-primary" />
            <div className="text-sm">
              <strong className="block font-semibold">Sorteio</strong>
              <span>Ainda nao tem nenhum resultado lancado nessa temporada — se a folga ou os confrontos saíram torto, pode sortear de novo.</span>
            </div>
          </div>
          <Button variant="outline" size="sm" type="button" disabled={tournament.redrawing} onClick={tournament.redrawMatches}>
            <Dices aria-hidden="true" />
            {tournament.redrawing ? 'Sorteando' : 'Sortear de novo'}
          </Button>
        </div>
      ) : null}

      {activeView === 'newSeason' && isAdmin ? (
        <div className="mt-6">
          <SeasonSetupPanel
            suggestedName={`Temporada ${seasons.seasons.length + 1}`}
            creating={seasons.creating}
            onCreateSeason={async (name, rounds, players) => {
              await seasons.createSeason(name, rounds, players)
              setActiveView('dashboard')
            }}
          />
        </div>
      ) : activeView === 'admin' && isAdmin ? (
        <AdminTeamsPanel
          players={tournament.players}
          onSavePlayer={tournament.savePlayer}
          onUploadPhoto={tournament.uploadPlayerPhoto}
          onSyncTeamRoster={tournament.syncTeamRoster}
        />
      ) : activeView === 'scorers' ? (
        <TopScorersPage scorers={tournament.topScorers} />
      ) : activeView === 'knockout' ? (
        <KnockoutBracketCard
          bracket={tournament.knockoutBracket}
          savingMatchId={tournament.savingKnockoutMatchId}
          onSaveScore={tournament.saveKnockoutScore}
        />
      ) : (
        <>
          {tournament.error ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{tournament.error}</AlertDescription>
            </Alert>
          ) : null}

          {tournament.loading && seasons.selectedSeasonId ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="animate-spin" size={18} aria-hidden="true" />
              Sincronizando dados
            </div>
          ) : null}

          {seasons.selectedSeasonId ? (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <StandingsTable standings={tournament.standings} />
              <RoundPanel
                players={tournament.players}
                matches={tournament.matches}
                roundMatches={tournament.roundMatches}
                byePlayer={tournament.byePlayer}
                selectedRound={tournament.selectedRound}
                totalRounds={tournament.totalRounds}
                savingMatchId={tournament.savingMatchId}
                onRoundChange={tournament.setSelectedRound}
                onSaveScore={tournament.saveScore}
              />
            </div>
          ) : null}

          <div className="mt-6">
            <TournamentRules />
          </div>
        </>
      )}
    </main>
  )
}
