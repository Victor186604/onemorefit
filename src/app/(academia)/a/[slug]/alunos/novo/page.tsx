import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { AlunoForm } from '@/features/alunos/AlunoForm'

export const metadata: Metadata = { title: 'Novo aluno' }

export default async function NovoAlunoPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'alunos.criar')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novo aluno</h1>
      </div>
      <AlunoForm slug={params.slug} academiaId={session.academia.id} />
    </div>
  )
}
