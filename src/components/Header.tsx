import type { User } from 'firebase/auth'
import { BarChart3, LogOut, Shield, Trophy, UsersRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

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
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-purple text-white">
          <Trophy size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Campeonato FIFA
          </p>
          <h1 className="text-lg font-bold text-brand-purple">Pontos Corridos</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={activeView} onValueChange={(value) => onViewChange?.(value as AppView)}>
          <TabsList aria-label="Navegacao principal">
            <TabsTrigger value="dashboard">
              <Trophy size={16} aria-hidden="true" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="scorers">
              <BarChart3 size={16} aria-hidden="true" />
              Artilheiros
            </TabsTrigger>
            {isAdmin ? (
              <TabsTrigger value="admin">
                <UsersRound size={16} aria-hidden="true" />
                Admin
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2.5">
          <Avatar>
            <AvatarImage src={user.photoURL ?? undefined} alt="" />
            <AvatarFallback>
              <Shield size={18} aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-sm leading-tight sm:block">
            <strong className="block font-semibold text-foreground">
              {user.displayName ?? 'Administrador'}
            </strong>
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onSignOut} title="Sair" aria-label="Sair">
            <LogOut size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
