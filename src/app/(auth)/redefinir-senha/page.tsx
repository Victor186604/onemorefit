import type { Metadata } from 'next'
import { RedefinirSenhaForm } from '@/features/auth/RedefinirSenhaForm'
import { AuthShell } from '@/components/layout/AuthShell'

export const metadata: Metadata = { title: 'Redefinir senha' }

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <AuthShell subtitulo="Redefinição de senha">
      <RedefinirSenhaForm token={token} />
    </AuthShell>
  )
}
