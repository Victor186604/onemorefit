import type { Metadata } from 'next'
import { db } from '@/server/db/client'
import { requirePlatformAdmin } from '@/server/auth/guards'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Plataforma | OneMoreFit' }

export default async function PlataformaPage() {
  await requirePlatformAdmin()
  const prisma = await db()

  const [totalAcademias, ativas, trial, inadimplentes] = await Promise.all([
    prisma.academia.count(),
    prisma.academia.count({ where: { assinatura: 'ATIVA' } }),
    prisma.academia.count({ where: { assinatura: 'TRIAL' } }),
    prisma.academia.count({ where: { assinatura: 'INADIMPLENTE' } }),
  ])

  const ultimasAcademias = await prisma.academia.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, nome: true, slug: true, situacao: true, assinatura: true, createdAt: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão geral da plataforma</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de academias', valor: totalAcademias, cor: 'text-gray-900' },
          { label: 'Assinatura ativa',   valor: ativas,         cor: 'text-green-700' },
          { label: 'Em trial',           valor: trial,          cor: 'text-yellow-700' },
          { label: 'Inadimplentes',      valor: inadimplentes,  cor: 'text-red-700' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-400 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.cor}`}>{c.valor}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Academias recentes</h2>
          <Link href="/plataforma/academias" className="text-sm text-brand-600 hover:underline">Ver todas</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Assinatura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ultimasAcademias.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/plataforma/academias/${a.id}`} className="font-medium text-gray-900 hover:text-brand-600">{a.nome}</Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.situacao === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.situacao}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.assinatura === 'ATIVA' ? 'bg-green-100 text-green-700' :
                    a.assinatura === 'TRIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{a.assinatura}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
