import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarData, formatarMoeda } from '@/lib/utils'
import { Decimal } from 'decimal.js'
import { differenceInDays } from 'date-fns'

export const metadata: Metadata = { title: 'Inadimplência' }

export default async function InadimplenciaPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'relatorios.ver')

  const prisma     = await db()
  const academiaId = session.academia.id
  const hoje       = new Date()

  const vencidas = await prisma.mensalidade.findMany({
    where: {
      academiaId,
      situacao:   { in: ['EM_ABERTO', 'PARCIAL'] },
      vencimento: { lt: hoje },
    },
    orderBy: { vencimento: 'asc' },
    include: {
      matricula: { include: { aluno: { select: { id: true, nome: true, telefone: true } } } },
    },
  })

  // Agrupar por faixa de atraso
  const faixas = [
    { label: 'Até 30 dias',  min: 0,   max: 30  },
    { label: '31 a 60 dias', min: 31,  max: 60  },
    { label: '61 a 90 dias', min: 61,  max: 90  },
    { label: 'Acima de 90', min: 91,  max: Infinity },
  ]

  const agrupado = faixas.map(faixa => {
    const itens = vencidas.filter(m => {
      const dias = differenceInDays(hoje, new Date(m.vencimento))
      return dias >= faixa.min && dias <= faixa.max
    })
    const total = itens.reduce((s, m) => {
      const saldo = new Decimal(m.valorOriginal.toString())
        .minus(m.desconto.toString()).plus(m.acrescimo.toString())
        .minus(m.valorRecebido.toString())
      return s.plus(saldo)
    }, new Decimal(0))
    return { ...faixa, itens, total }
  })

  const totalGeral = vencidas.reduce((s, m) => {
    const saldo = new Decimal(m.valorOriginal.toString())
      .minus(m.desconto.toString()).plus(m.acrescimo.toString())
      .minus(m.valorRecebido.toString())
    return s.plus(saldo)
  }, new Decimal(0))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inadimplência</h1>
        <p className="text-gray-500 text-sm mt-1">
          {vencidas.length} cobrança{vencidas.length !== 1 ? 's' : ''} vencida{vencidas.length !== 1 ? 's' : ''} — Total: {formatarMoeda(totalGeral.toString())}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {agrupado.map(f => (
          <div key={f.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-400 mb-1">{f.label}</div>
            <div className="text-lg font-bold text-red-600">{formatarMoeda(f.total.toString())}</div>
            <div className="text-xs text-gray-400">{f.itens.length} cobranças</div>
          </div>
        ))}
      </div>

      {agrupado.map(f => f.itens.length > 0 && (
        <div key={f.label} className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">{f.label} ({f.itens.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Atraso</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {f.itens.map(m => {
                  const dias  = differenceInDays(hoje, new Date(m.vencimento))
                  const saldo = new Decimal(m.valorOriginal.toString())
                    .minus(m.desconto.toString()).plus(m.acrescimo.toString())
                    .minus(m.valorRecebido.toString())
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.matricula.aluno.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{m.matricula.aluno.telefone ?? '—'}</td>
                      <td className="px-4 py-3 text-red-600">{formatarData(m.vencimento)}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{dias} dias</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-700">{formatarMoeda(saldo.toString())}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
