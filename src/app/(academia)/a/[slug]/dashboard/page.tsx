import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { DashboardCards } from '@/features/dashboard/DashboardCards'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'
import { Decimal } from 'decimal.js'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = await getAcademiaSession(params.slug)
  const prisma  = await db()
  const { id: academiaId } = session.academia

  const hoje   = new Date()
  const inicio = startOfMonth(hoje)
  const fim    = endOfMonth(hoje)

  const [
    alunosAtivos,
    novasMatriculas,
    mensalidadesVencidas,
    inadimplentes,
    recebimentosMes,
    despesasMes,
    presencasHoje,
    matriculasProxTermino,
    alunosSemFrequencia,
  ] = await Promise.all([
    // Alunos com matrícula ativa
    prisma.matricula.count({ where: { academiaId, situacao: 'ATIVA' } }),

    // Novas matrículas no mês
    prisma.matricula.count({
      where: { academiaId, dataInicio: { gte: inicio, lte: fim } },
    }),

    // Mensalidades vencidas não pagas
    prisma.mensalidade.count({
      where: {
        academiaId,
        situacao:   { in: ['EM_ABERTO', 'PARCIAL'] },
        vencimento: { lt: hoje },
      },
    }),

    // Alunos inadimplentes (distintos)
    prisma.mensalidade.findMany({
      where: {
        academiaId,
        situacao:   { in: ['EM_ABERTO', 'PARCIAL'] },
        vencimento: { lt: hoje },
      },
      select: { matricula: { select: { alunoId: true } } },
      distinct: ['matriculaId'],
    }).then(rows => new Set(rows.map(r => r.matricula.alunoId)).size),

    // Recebimentos no mês
    prisma.recebimento.aggregate({
      where: {
        academiaId,
        estornado:    false,
        dataPagamento: { gte: inicio, lte: fim },
      },
      _sum: { valor: true },
    }).then(r => r._sum.valor ?? new Decimal(0)),

    // Despesas pagas no mês
    prisma.movimento.aggregate({
      where: {
        academiaId,
        tipo:     'DESPESA',
        estornado: false,
        data:     { gte: inicio, lte: fim },
      },
      _sum: { valor: true },
    }).then(r => r._sum.valor ?? new Decimal(0)),

    // Presenças hoje
    prisma.presenca.count({
      where: {
        academiaId,
        anuladaEm: null,
        dataHora: {
          gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
          lt:  new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1),
        },
      },
    }),

    // Matrículas próximas do término (próximos 30 dias)
    prisma.matricula.count({
      where: {
        academiaId,
        situacao:    'ATIVA',
        dataTermino: { gte: hoje, lte: new Date(hoje.getTime() + 30 * 86400000) },
      },
    }),

    // Alunos sem frequência nos últimos 15 dias
    prisma.aluno.count({
      where: {
        academiaId,
        situacao: 'ATIVO',
        matriculas: { some: { situacao: 'ATIVA' } },
        presencas: {
          none: {
            anuladaEm: null,
            dataHora: { gte: subDays(hoje, 15) },
          },
        },
      },
    }),
  ])

  const valorEmAtraso = await prisma.mensalidade.aggregate({
    where: {
      academiaId,
      situacao:   { in: ['EM_ABERTO', 'PARCIAL'] },
      vencimento: { lt: hoje },
    },
    _sum: { valorOriginal: true, valorRecebido: true },
  }).then(r => {
    const orig = new Decimal(r._sum.valorOriginal?.toString() ?? '0')
    const rec  = new Decimal(r._sum.valorRecebido?.toString() ?? '0')
    return orig.minus(rec)
  })

  return (
    <DashboardCards
      slug={params.slug}
      dados={{
        alunosAtivos,
        novasMatriculas,
        mensalidadesVencidas,
        inadimplentes,
        valorEmAtraso: valorEmAtraso.toFixed(2),
        recebimentosMes: recebimentosMes.toString(),
        despesasMes: despesasMes.toString(),
        saldo: new Decimal(recebimentosMes.toString()).minus(despesasMes.toString()).toFixed(2),
        presencasHoje,
        matriculasProxTermino,
        alunosSemFrequencia,
      }}
    />
  )
}
