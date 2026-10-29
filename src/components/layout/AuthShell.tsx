import { Logo } from '@/components/brand/Logo'

/** Moldura das telas públicas (login, redefinir senha, convite). */
export function AuthShell({ subtitulo, children }: { subtitulo: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex justify-center">
            <Logo variante="branca" largura={260} prioridade />
          </h1>
          <p className="text-zinc-300 mt-3 text-sm">{subtitulo}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
        <p className="text-center text-zinc-500 text-xs mt-6">Desenvolvido por OneMoreCode</p>
      </div>
    </main>
  )
}
