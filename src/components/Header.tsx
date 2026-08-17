import type { User } from 'firebase/auth'
import { LogOut, Shield, Trophy } from 'lucide-react'

type HeaderProps = {
  user: User
  onSignOut: () => void
}

export function Header({ user, onSignOut }: HeaderProps) {
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
