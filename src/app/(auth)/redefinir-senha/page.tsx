import type { Metadata } from 'next'
import { RedefinirSenhaForm } from '@/features/auth/RedefinirSenhaForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Redefinir senha' }

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex justify-center">
            <Logo variante="branca" largura={240} prioridade />
          </h1>
          <p className="text-brand-200 mt-3 text-sm">Redefinição de senha</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <RedefinirSenhaForm token={searchParams.token} />
        </div>
        <p className="text-center text-brand-400 text-xs mt-6">Desenvolvido por OneMoreCode</p>
      </div>
    </main>
  )
}
