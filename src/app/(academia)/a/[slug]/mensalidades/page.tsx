import type { Metadata } from 'next'
import Link from 'next/link'
import { FiltroSelect } from '@/components/FiltroSelect'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarData, formatarMoeda, formatarCompetencia } from '@/lib/utils'
import { Decimal } from 'decimal.js'

export const metadata: Metadata = { title: 'Mensalidades' }

const POR_PAGINA = 25

export default async function MensalidadesPage({
  params, searchParams,
}: {
  params: { slug: string }
  searchParams: { q?: string; situacao?: string; pagina?: string }
}) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'mensalidades.ver')

  const prisma     = await db()
  const academiaId = session.academia.id
  const pagina     = Number(searchParams.pagina ?? 1)
  const busca      = searchParams.q?.trim() ?? ''
  const situacao   = searchParams.situacao
  const hoje       = new Date()

  const where: any = {
    academiaId,
    ...(situacao === 'VENCIDA'
      ? { situacao: { in: ['EM_ABERTO', 'PARCIAL'] }, vencimento: { lt: hoje } }
      : situacao ? { situacao } : {}),
    ...(busca ? { matricula: { aluno: { nome: { contains: busca, mode: 'insensitive' } } } } : {}),
  }

  const [mensalidades, total] = await Promise.all([
    prisma.mensalidade.findMany({
      where,
      orderBy: [{ vencimento: 'desc' }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        matricula: { include: { aluno: { select: { id: true, nome: true } } } },
      },
    }),
    prisma.mensalidade.count({ where }),
  ])

  const base = `/a/${params.slug}/mensalidades`
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  const situacaoConfig: Record<string, { label: string; cls: string }> = {
    EM_ABERTO: { label: 'Em aberto', cls: 'bg-yellow-100 text-yellow-700' },
    PARCIAL:   { label: 'Parcial',   cls: 'bg-blue-100 text-blue-700' },
    PAGA:      { label: 'Paga',      cls: 'bg-green-100 text-green-700' },
    CANCELADA: { label: 'Cancelada', cls: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registro{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <form className="flex gap-2 flex-1 min-w-48">
          <input name="q" defaultValue={busca} placeholder="Nome do aluno"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800">Buscar</button>
        </form>
        <FiltroSelect param="situacao" valor={situacao ?? ''}>
          <option value="">Todas</option>
          <option value="EM_ABERTO">Em aberto</option>
          <option value="VENCIDA">Vencidas</option>
          <option value="PARCIAL">Parcialmente pagas</option>
          <option value="PAGA">Pagas</option>
          <option value="CANCELADA">Canceladas</option>
        </FiltroSelect>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aluno</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Competência</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimento</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Recebido</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mensalidades.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhuma mensalidade encontrada</td></tr>
              )}
              {mensalidades.map(m => {
                const s = situacaoConfig[m.situacao] ?? { label: m.situacao, cls: 'bg-gray-100 text-gray-600' }
                const valorDevido = new Decimal(m.valorOriginal.toString())
                  .minus(m.desconto.toString()).plus(m.acrescimo.toString())
                const saldo = valorDevido.minus(m.valorRecebido.toString())
                const vencida = m.situacao !== 'PAGA' && m.situacao !== 'CANCELADA' && new Date(m.vencimento) < hoje

                return (
                  <tr key={m.id} className={`hover:bg-gray-50 ${vencida ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/a/${params.slug}/alunos/${m.matricula.aluno.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {m.matricula.aluno.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatarCompetencia(m.competencia)}</td>
                    <td className={`px-4 py-3 ${vencida ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {formatarData(m.vencimento)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatarMoeda(valorDevido.toString())}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatarMoeda(m.valorRecebido.toString())}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatarMoeda(saldo.toString())}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {m.situacao !== 'PAGA' && m.situacao !== 'CANCELADA' && (
                        <Link href={`${base}/${m.id}/receber`} className="text-xs text-brand-600 hover:underline font-medium">
                          Receber
                        </Link>
                      )}
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
