import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarDataHora } from '@/lib/utils'
import { CheckInForm } from '@/features/presencas/CheckInForm'

export const metadata: Metadata = { title: 'Presenças' }

export default async function PresencasPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'presencas.ver')

  const prisma     = await db()
  const academiaId = session.academia.id
  const hoje       = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimHoje    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)

  const presencasHoje = await prisma.presenca.findMany({
    where: {
      academiaId,
      anuladaEm: null,
      dataHora: { gte: inicioHoje, lt: fimHoje },
    },
    orderBy: { dataHora: 'desc' },
    include: {
      aluno: { select: { id: true, nome: true } },
      registrador: { select: { nome: true } },
    },
  })

  const podeRegistrar = ['ADMIN', 'RECEPCAO'].includes(session.papel)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presenças</h1>
          <p className="text-gray-500 text-sm mt-1">{presencasHoje.length} hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {podeRegistrar && (
          <div className="lg:col-span-1">
            <CheckInForm
              academiaId={academiaId}
              slug={params.slug}
              userId={session.user.id}
            />
          </div>
        )}

        <div className={podeRegistrar ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Presenças de hoje</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {presencasHoje.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Nenhuma presença registrada hoje
                </div>
              )}
              {presencasHoje.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{p.aluno.nome}</div>
                    <div className="text-xs text-gray-400">{formatarDataHora(p.dataHora)}</div>
                  </div>
                  <div className="text-xs text-gray-400">{p.registrador?.nome ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
