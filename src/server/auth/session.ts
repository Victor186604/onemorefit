import { auth } from './index'
import { db } from '@/server/db/client'
import { redirect } from 'next/navigation'
import type { PapelAcademia } from '@prisma/client'

export interface SessionUser {
  id: string
  nome: string
  email: string
  isPlatformAdmin: boolean
}

export interface AcademiaSession {
  user: SessionUser
  academia: {
    id: string
    nome: string
    slug: string
    situacao: string
    assinatura: string
  }
  papel: PapelAcademia
  vinculoId: string
}

/** Retorna o usuário autenticado ou redireciona para /login */
export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const prisma = await db()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { platformAdmin: true },
  })

  if (!user || !user.ativo) redirect('/login')

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    isPlatformAdmin: Boolean(user.platformAdmin),
  }
}

/** Retorna sessão completa com academia ativa (slug na URL) */
export async function getAcademiaSession(slug: string): Promise<AcademiaSession> {
  const user = await getSessionUser()
  const prisma = await db()

  const academia = await prisma.academia.findUnique({
    where: { slug },
    select: {
      id: true, nome: true, slug: true,
      situacao: true, assinatura: true,
    },
  })

  if (!academia) redirect('/selecionar-academia')

  if (academia.situacao === 'SUSPENSA' && !user.isPlatformAdmin) {
    redirect('/academia-suspensa')
  }

  // Platform admin não precisa de vínculo para acessar (somente painel da plataforma)
  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: academia.id } },
  })

  if (!vinculo || !vinculo.ativo) redirect('/selecionar-academia')

  return {
    user,
    academia: {
      id: academia.id,
      nome: academia.nome,
      slug: academia.slug,
      situacao: academia.situacao,
      assinatura: academia.assinatura,
    },
    papel: vinculo.papel,
    vinculoId: vinculo.id,
  }
}
