import { Mail, Trophy } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'

type LoginScreenProps = {
  error: string
  onSignIn: () => void
}

export function LoginScreen({ error, onSignIn }: LoginScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-none py-10 shadow-2xl shadow-brand-purple/10">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-purple text-white">
            <Trophy aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            FC Tournament
          </p>
          <h1 className="text-2xl font-bold text-balance text-brand-purple">
            Gerencie o campeonato FIFA em pontos corridos.
          </h1>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm text-muted-foreground">
            Entre com o Gmail para abrir a tabela, lançar placares e acompanhar as rodadas do turno e
            returno.
          </p>
          {error ? (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button variant="cta" size="lg" className="w-full" type="button" onClick={onSignIn}>
            <Mail aria-hidden="true" />
            Entrar com Google
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
