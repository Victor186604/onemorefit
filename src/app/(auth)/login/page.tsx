import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/LoginForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e nome */}
        <div className="text-center mb-8">
          <h1 className="flex justify-center">
            <Logo variante="branca" largura={260} prioridade />
          </h1>
          <p className="text-brand-200 mt-3 text-sm">Gestão para academias e estúdios</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Acesse sua conta</h2>
          <LoginForm />
        </div>

        <p className="text-center text-brand-400 text-xs mt-6">
          Desenvolvido por OneMoreCode
        </p>
      </div>
    </main>
  )
}
