import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/server/auth'
import { db } from '@/server/db/client'

export async function GET(
  req: NextRequest,
  { params }: { params: { academiaId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

  const prisma     = await db()
  const academiaId = params.academiaId
  const q          = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({ alunos: [] })

  // Verificar vínculo
  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: session.user.id, academiaId } },
  })
  if (!vinculo || !vinculo.ativo) return NextResponse.json({ erro: 'Sem acesso' }, { status: 403 })

  const hoje = new Date()

  const alunos = await prisma.aluno.findMany({
    where: {
      academiaId,
      situacao: 'ATIVO',
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { telefone: { contains: q } },
      ],
    },
    take: 10,
    select: {
      id: true,
      nome: true,
      matriculas: {
        where: { situacao: 'ATIVA' },
        select: { id: true },
        take: 1,
      },
    },
  })

  // Como o Prisma não suporta relação indireta direta, busca via join explícito
  const resultado = await Promise.all(alunos.map(async a => {
    const matriculaAtiva = a.matriculas.length > 0
    const inadimplente   = await prisma.mensalidade.count({
      where: {
        academiaId,
        matricula: { alunoId: a.id, situacao: 'ATIVA' },
        situacao:  { in: ['EM_ABERTO', 'PARCIAL'] },
        vencimento:{ lt: hoje },
      },
    })
    const pendente = await prisma.mensalidade.count({
      where: {
        academiaId,
        matricula: { alunoId: a.id, situacao: 'ATIVA' },
        situacao:  { in: ['EM_ABERTO', 'PARCIAL'] },
      },
    })

    return {
      id: a.id,
      nome: a.nome,
      matriculaAtiva,
      situacaoFinanceira: inadimplente > 0 ? 'inadimplente' : pendente > 0 ? 'pendente' : 'ok',
    }
  }))

  return NextResponse.json({ alunos: resultado })
}
