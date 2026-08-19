import type { User } from 'firebase/auth'
import { LogOut, Shield, Trophy, UsersRound } from 'lucide-react'

type HeaderProps = {
  user: User
  isAdmin?: boolean
  activeView?: 'dashboard' | 'admin'
  onViewChange?: (view: 'dashboard' | 'admin') => void
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
        {isAdmin ? (
          <button
            className={activeView === 'admin' ? 'nav-button active' : 'nav-button'}
            type="button"
            onClick={() => onViewChange?.(activeView === 'admin' ? 'dashboard' : 'admin')}
          >
            <UsersRound size={17} aria-hidden="true" />
            {activeView === 'admin' ? 'Tabela' : 'Admin'}
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
