import type { Metadata } from 'next'
import Link from 'next/link'
import { FiltroSelect } from '@/components/FiltroSelect'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarData, formatarMoeda } from '@/lib/utils'
import { Decimal } from 'decimal.js'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Financeiro' }

const POR_PAGINA = 25

export default async function FinanceiroPage({
  params, searchParams,
}: {
  params: { slug: string }
  searchParams: { tipo?: string; pagina?: string }
}) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'financeiro.ver')

  const prisma     = await db()
  const academiaId = session.academia.id
  const pagina     = Number(searchParams.pagina ?? 1)
  const tipo       = searchParams.tipo

  const where: any = {
    academiaId,
    estornado: false,
    ...(tipo ? { tipo } : {}),
  }

  const [movimentos, total, contas] = await Promise.all([
    prisma.movimento.findMany({
      where,
      orderBy: { data: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        categoria:  { select: { nome: true } },
        conta:      { select: { nome: true } },
        formaPgto:  { select: { nome: true } },
      },
    }),
    prisma.movimento.count({ where }),
    prisma.conta.findMany({ where: { academiaId, ativo: true } }),
  ])

  const base = `/a/${params.slug}/financeiro`
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  const tipoConfig: Record<string, { label: string; cls: string }> = {
    RECEITA:               { label: 'Receita',              cls: 'text-green-700' },
    DESPESA:               { label: 'Despesa',              cls: 'text-red-600' },
    TRANSFERENCIA_SAIDA:   { label: 'Transf. saída',        cls: 'text-gray-500' },
    TRANSFERENCIA_ENTRADA: { label: 'Transf. entrada',      cls: 'text-gray-500' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">{total} movimento{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`${base}/despesa/nova`} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
            <Plus size={16} /> Despesa
          </Link>
        </div>
      </div>

      {/* Resumo de contas */}
      {contas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {contas.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-400 mb-1">{c.nome}</div>
              <div className="text-lg font-bold text-gray-900">—</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <FiltroSelect param="tipo" valor={tipo ?? ''}>
          <option value="">Todos</option>
          <option value="RECEITA">Receitas</option>
          <option value="DESPESA">Despesas</option>
          <option value="TRANSFERENCIA_SAIDA">Transferências</option>
        </FiltroSelect>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Conta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimentos.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum movimento</td></tr>
              )}
              {movimentos.map(m => {
                const tc = tipoConfig[m.tipo]
                const neg = m.tipo === 'DESPESA' || m.tipo === 'TRANSFERENCIA_SAIDA'
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{formatarData(m.data)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.descricao}</td>
                    <td className="px-4 py-3 text-gray-500">{m.categoria?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.conta?.nome ?? '—'}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${tc?.cls}`}>{tc?.label}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${neg ? 'text-red-600' : 'text-green-700'}`}>
                      {neg ? '−' : '+'}{formatarMoeda(m.valor.toString())}
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
