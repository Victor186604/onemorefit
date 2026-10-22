import type { Metadata } from 'next'
import Link from 'next/link'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { formatarMoeda } from '@/lib/utils'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Planos' }

export default async function PlanosPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'planos.ver')

  const prisma = await db()
  const planos = await prisma.plano.findMany({
    where:   { academiaId: session.academia.id },
    orderBy: { nome: 'asc' },
    include: { _count: { select: { matriculas: { where: { situacao: 'ATIVA' } } } } },
  })

  const base = `/a/${params.slug}/planos`
  const podeGerenciar = session.papel === 'ADMIN'

  const tipoLabel: Record<string, string> = {
    MENSAL_RECORRENTE: 'Mensal recorrente',
    CONTRATO_PRAZO:    'Contrato com prazo',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
          <p className="text-gray-500 text-sm mt-1">{planos.length} plano{planos.length !== 1 ? 's' : ''}</p>
        </div>
        {podeGerenciar && (
          <Link href={`${base}/novo`} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors">
            <Plus size={16} /> Novo plano
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {planos.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            Nenhum plano cadastrado.
          </div>
        )}
        {planos.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                {p.modalidade && <p className="text-xs text-gray-400 mt-0.5">{p.modalidade}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {p.descricao && <p className="text-sm text-gray-500">{p.descricao}</p>}

            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Valor</span>
                <span className="font-semibold text-gray-900">{formatarMoeda(p.valor.toString())}/mês</span>
              </div>
              {p.taxaMatricula && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxa de matrícula</span>
                  <span className="text-gray-700">{formatarMoeda(p.taxaMatricula.toString())}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="text-gray-700">{tipoLabel[p.tipoDuracao]}</span>
              </div>
              {p.duracaoMeses && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Duração</span>
                  <span className="text-gray-700">{p.duracaoMeses} meses</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Matrículas ativas</span>
                <span className="font-medium text-brand-700">{p._count.matriculas}</span>
              </div>
            </div>

            {podeGerenciar && (
              <Link href={`${base}/${p.id}/editar`} className="text-center text-sm text-brand-600 hover:underline mt-1">
                Editar plano
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
