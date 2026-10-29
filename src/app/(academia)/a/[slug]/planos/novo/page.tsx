import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { PlanoForm } from '@/features/planos/PlanoForm'

export const metadata: Metadata = { title: 'Novo plano' }

export default async function NovoPlanoPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'planos.gerenciar')
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo plano</h1>
      <PlanoForm slug={params.slug} academiaId={session.academia.id} />
    </div>
  )
}
