import type { User } from 'firebase/auth'
import { BarChart3, LogOut, Shield, Trophy, UsersRound } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5 sm:gap-4">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white sm:size-11">
          <Trophy size={18} className="sm:hidden" aria-hidden="true" />
          <Trophy size={22} className="hidden sm:block" aria-hidden="true" />
        </span>
        <div>
          <p className="hidden text-xs font-semibold tracking-widest text-muted-foreground uppercase sm:block">
            Campeonato FIFA
          </p>
          <h1 className="text-base font-bold text-brand-purple dark:text-primary sm:text-lg">Pontos Corridos</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        <Tabs value={activeView} onValueChange={(value) => onViewChange?.(value as AppView)}>
          <TabsList aria-label="Navegacao principal">
            <TabsTrigger value="dashboard">
              <Trophy size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Tabela</span>
            </TabsTrigger>
            <TabsTrigger value="scorers">
              <BarChart3 size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Artilheiros</span>
            </TabsTrigger>
            {isAdmin ? (
              <TabsTrigger value="admin">
                <UsersRound size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 sm:gap-2.5">
          <Avatar className="size-8 sm:size-9">
            <AvatarImage src={user.photoURL ?? undefined} alt="" />
            <AvatarFallback>
              <Shield size={16} aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-sm leading-tight md:block">
            <strong className="block font-semibold text-foreground">
              {user.displayName ?? 'Administrador'}
            </strong>
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" type="button" onClick={onSignOut} title="Sair" aria-label="Sair">
            <LogOut size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
