import Link from 'next/link'
import {
  Users, UserPlus, AlertCircle, TrendingDown,
  DollarSign, TrendingUp, CheckSquare, Clock,
  UserX, ArrowRight
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

interface Dados {
  alunosAtivos: number
  novasMatriculas: number
  mensalidadesVencidas: number
  inadimplentes: number
  valorEmAtraso: string
  recebimentosMes: string
  despesasMes: string
  saldo: string
  presencasHoje: number
  matriculasProxTermino: number
  alunosSemFrequencia: number
}

interface Props { slug: string; dados: Dados }

export function DashboardCards({ slug, dados }: Props) {
  const base = `/a/${slug}`
  const saldoPositivo = Number(dados.saldo) >= 0

  const cards = [
    {
      label: 'Alunos ativos',
      valor: dados.alunosAtivos,
      icon:  Users,
      cor:   'blue',
      href:  `${base}/alunos?situacao=ATIVO`,
    },
    {
      label: 'Novas matrículas (mês)',
      valor: dados.novasMatriculas,
      icon:  UserPlus,
      cor:   'green',
      href:  `${base}/matriculas`,
    },
    {
      label: 'Cobranças vencidas',
      valor: dados.mensalidadesVencidas,
      icon:  AlertCircle,
      cor:   dados.mensalidadesVencidas > 0 ? 'red' : 'green',
      href:  `${base}/mensalidades?situacao=VENCIDA`,
    },
    {
      label: 'Inadimplentes',
      valor: dados.inadimplentes,
      icon:  TrendingDown,
      cor:   dados.inadimplentes > 0 ? 'red' : 'green',
      href:  `${base}/alunos?situacao=INADIMPLENTE`,
    },
    {
      label: 'Valor em atraso',
      valor: formatarMoeda(dados.valorEmAtraso),
      icon:  DollarSign,
      cor:   Number(dados.valorEmAtraso) > 0 ? 'red' : 'green',
      href:  `${base}/mensalidades?situacao=VENCIDA`,
    },
    {
      label: 'Recebimentos (mês)',
      valor: formatarMoeda(dados.recebimentosMes),
      icon:  TrendingUp,
      cor:   'green',
      href:  `${base}/financeiro`,
    },
    {
      label: 'Despesas (mês)',
      valor: formatarMoeda(dados.despesasMes),
      icon:  TrendingDown,
      cor:   'orange',
      href:  `${base}/financeiro`,
    },
    {
      label: 'Saldo do período',
      valor: formatarMoeda(dados.saldo),
      icon:  DollarSign,
      cor:   saldoPositivo ? 'green' : 'red',
      href:  `${base}/financeiro`,
      nota: 'Recebimentos menos despesas registradas',
    },
    {
      label: 'Presenças hoje',
      valor: dados.presencasHoje,
      icon:  CheckSquare,
      cor:   'blue',
      href:  `${base}/presencas`,
    },
    {
      label: 'Matrículas próximas do término',
      valor: dados.matriculasProxTermino,
      icon:  Clock,
      cor:   dados.matriculasProxTermino > 0 ? 'orange' : 'green',
      href:  `${base}/matriculas?situacao=PROXIMO_TERMINO`,
    },
    {
      label: 'Sem frequência (15 dias)',
      valor: dados.alunosSemFrequencia,
      icon:  UserX,
      cor:   dados.alunosSemFrequencia > 0 ? 'orange' : 'green',
      href:  `${base}/alunos?situacao=SEM_FREQUENCIA`,
    },
  ]

  const corClasses: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700 ring-blue-200',
    green:  'bg-green-50 text-green-700 ring-green-200',
    red:    'bg-red-50 text-red-700 ring-red-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 text-sm mt-1">Dados em tempo real — mês atual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          const iconCls = corClasses[card.cor] ?? corClasses.blue
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">{card.label}</span>
                <div className={`p-2 rounded-lg ring-1 ${iconCls}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-900">{card.valor}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-600 transition-colors" />
              </div>
              {card.nota && (
                <p className="text-xs text-gray-400">{card.nota}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
