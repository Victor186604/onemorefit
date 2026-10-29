import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { ConfigAcademiaForm } from '@/features/configuracoes/ConfigAcademiaForm'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'configuracoes.gerenciar')

  const prisma   = await db()
  const academia = await prisma.academia.findUnique({
    where:   { id: session.academia.id },
    include: { configuracoes: true },
  })

  if (!academia) return null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      <ConfigAcademiaForm academia={academia} slug={params.slug} />
    </div>
  )
}
