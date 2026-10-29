import type { Metadata } from 'next'
import Link from 'next/link'
import { FiltroSelect } from '@/components/FiltroSelect'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarData, formatarMoeda } from '@/lib/utils'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Matrículas' }

const POR_PAGINA = 20

const situacaoLabel: Record<string, { label: string; cls: string }> = {
  ATIVA:     { label: 'Ativa',     cls: 'bg-green-100 text-green-700' },
  ENCERRADA: { label: 'Encerrada', cls: 'bg-gray-100 text-gray-500' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  SUSPENSA:  { label: 'Suspensa',  cls: 'bg-yellow-100 text-yellow-700' },
}

export default async function MatriculasPage({
  params, searchParams,
}: {
  params: { slug: string }
  searchParams: { q?: string; situacao?: string; pagina?: string }
}) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'matriculas.ver')

  const prisma     = await db()
  const academiaId = session.academia.id
  const pagina     = Number(searchParams.pagina ?? 1)
  const busca      = searchParams.q?.trim() ?? ''
  const situacao   = searchParams.situacao

  const where: any = {
    academiaId,
    ...(situacao ? { situacao } : {}),
    ...(busca ? { aluno: { nome: { contains: busca, mode: 'insensitive' } } } : {}),
  }

  const [matriculas, total] = await Promise.all([
    prisma.matricula.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        aluno: { select: { id: true, nome: true } },
      },
    }),
    prisma.matricula.count({ where }),
  ])

  const base = `/a/${params.slug}/matriculas`
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-gray-500 text-sm mt-1">{total} matrícula{total !== 1 ? 's' : ''}</p>
        </div>
        {['ADMIN', 'RECEPCAO'].includes(session.papel) && (
          <Link href={`${base}/nova`} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800">
            <Plus size={16} /> Nova matrícula
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <form className="flex gap-2 flex-1 min-w-48">
          <input name="q" defaultValue={busca} placeholder="Nome do aluno"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800">Buscar</button>
        </form>
        <FiltroSelect param="situacao" valor={situacao ?? ''}>
          <option value="">Todas</option>
          <option value="ATIVA">Ativas</option>
          <option value="ENCERRADA">Encerradas</option>
          <option value="CANCELADA">Canceladas</option>
        </FiltroSelect>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aluno</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plano</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Início</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Término</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matriculas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhuma matrícula encontrada</td></tr>
              )}
              {matriculas.map(m => {
                const s = situacaoLabel[m.situacao] ?? { label: m.situacao, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/a/${params.slug}/alunos/${m.aluno.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {m.aluno.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{m.planoNome}</td>
                    <td className="px-4 py-3 text-gray-700">{formatarMoeda(m.valorContratado.toString())}</td>
                    <td className="px-4 py-3 text-gray-500">{formatarData(m.dataInicio)}</td>
                    <td className="px-4 py-3 text-gray-500">{m.dataTermino ? formatarData(m.dataTermino) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">Dia {m.diaVencimento}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && <Link href={`${base}?${new URLSearchParams({ ...searchParams, pagina: String(pagina - 1) })}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Anterior</Link>}
              {pagina < totalPaginas && <Link href={`${base}?${new URLSearchParams({ ...searchParams, pagina: String(pagina + 1) })}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Próxima</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
