import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/LoginForm'
import { AuthShell } from '@/components/layout/AuthShell'

export const metadata: Metadata = { title: 'Entrar' }

/** Só aceita caminhos internos (evita mandar o usuário para outro site após o login). */
function destinoSeguro(v?: string): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return '/selecionar-academia'
  return v
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  return (
    <AuthShell subtitulo="Gestão para academias e estúdios">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Acesse sua conta</h2>
      <LoginForm destino={destinoSeguro(callbackUrl)} />
    </AuthShell>
  )
}
