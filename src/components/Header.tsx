import type { User } from 'firebase/auth'
import { BarChart3, LogOut, Shield, Trophy, UsersRound } from 'lucide-react'

export type AppView = 'dashboard' | 'scorers' | 'admin'

type HeaderProps = {
  user: User
  isAdmin?: boolean
  activeView?: AppView
  onViewChange?: (view: AppView) => void
  onSignOut: () => void
}

export function Header({ user, isAdmin = false, activeView = 'dashboard', onViewChange, onSignOut }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-title">
        <span className="header-icon">
          <Trophy size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Campeonato FIFA</p>
          <h1>Pontos Corridos</h1>
        </div>
      </div>

      <div className="user-area">
        <nav className="view-nav" aria-label="Navegacao principal">
          <button
            className={activeView === 'dashboard' ? 'nav-button active' : 'nav-button'}
            type="button"
            onClick={() => onViewChange?.('dashboard')}
          >
            <Trophy size={17} aria-hidden="true" />
            Tabela
          </button>
          <button
            className={activeView === 'scorers' ? 'nav-button active' : 'nav-button'}
            type="button"
            onClick={() => onViewChange?.('scorers')}
          >
            <BarChart3 size={17} aria-hidden="true" />
            Artilheiros
          </button>
        </nav>
        {isAdmin ? (
          <button
            className={activeView === 'admin' ? 'nav-button active' : 'nav-button'}
            type="button"
            onClick={() => onViewChange?.('admin')}
          >
            <UsersRound size={17} aria-hidden="true" />
            Admin
          </button>
        ) : null}
        {user.photoURL ? <img src={user.photoURL} alt="" className="user-photo" /> : <Shield size={22} aria-hidden="true" />}
        <div className="user-name">
          <strong>{user.displayName ?? 'Administrador'}</strong>
          <span>{user.email}</span>
        </div>
        <button className="icon-button" type="button" onClick={onSignOut} title="Sair">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
