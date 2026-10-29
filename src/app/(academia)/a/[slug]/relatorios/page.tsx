import type { Metadata } from 'next'
import Link from 'next/link'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { FileText, Users, CreditCard, TrendingDown, Calendar, UserX, BarChart2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Relatórios' }

export default async function RelatoriosPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'relatorios.ver')

  const base = `/a/${params.slug}/relatorios`

  const relatorios = [
    { href: `${base}/alunos-ativos`,    icon: Users,      titulo: 'Alunos ativos',          desc: 'Lista de alunos com matrícula ativa' },
    { href: `${base}/inadimplencia`,    icon: CreditCard, titulo: 'Inadimplência',           desc: 'Alunos com cobranças vencidas por faixa de atraso' },
    { href: `${base}/recebimentos`,     icon: BarChart2,  titulo: 'Recebimentos',            desc: 'Recebimentos por período e forma de pagamento' },
    { href: `${base}/despesas`,         icon: TrendingDown,titulo:'Despesas',                desc: 'Despesas por categoria e período' },
    { href: `${base}/fluxo-caixa`,      icon: BarChart2,  titulo: 'Fluxo de caixa',         desc: 'Entradas e saídas no período' },
    { href: `${base}/matriculas-fim`,   icon: Calendar,   titulo: 'Matrículas próx. término',desc: 'Contratos encerrando em breve' },
    { href: `${base}/frequencia`,       icon: Users,      titulo: 'Frequência',              desc: 'Presenças por aluno no período' },
    { href: `${base}/sem-frequencia`,   icon: UserX,      titulo: 'Sem frequência',          desc: 'Alunos ativos sem comparecimento recente' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">Selecione um relatório para visualizar e exportar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {relatorios.map(r => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all group flex gap-4 items-start">
              <div className="p-2.5 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors flex-shrink-0">
                <Icon size={20} className="text-brand-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{r.titulo}</div>
                <div className="text-sm text-gray-400 mt-0.5">{r.desc}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
