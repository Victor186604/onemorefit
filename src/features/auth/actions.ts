'use server'

import { db } from '@/server/db/client'
import { sendEmail, emailResetSenha, emailConvite } from '@/server/services/email'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { addHours, addDays } from 'date-fns'
import { z } from 'zod'

export async function solicitarResetSenha(email: string): Promise<{ erro?: string }> {
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { erro: 'E-mail inválido' }

  const prisma = await db()
  const user = await prisma.user.findUnique({ where: { email: parsed.data.toLowerCase() } })

  // Não revelar se o usuário existe
  if (!user) return {}

  // Invalidar tokens anteriores
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, tipo: 'RESET_SENHA', usadoEm: null },
    data:  { usadoEm: new Date() },
  })

  const token = nanoid(48)
  await prisma.verificationToken.create({
    data: {
      token,
      userId:    user.id,
      email:     user.email,
      tipo:      'RESET_SENHA',
      expiresAt: addHours(new Date(), 1),
    },
  })

  const url  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link = `${url}/redefinir-senha?token=${token}`

  await sendEmail({
    to:      user.email,
    subject: 'Redefinição de senha — OneMoreFit',
    html:    emailResetSenha(link, user.nome),
    text:    `Acesse: ${link}`,
  })

  return {}
}

export async function confirmarResetSenha(
  token: string,
  novaSenha: string,
): Promise<{ erro?: string }> {
  if (!token || novaSenha.length < 8) return { erro: 'Dados inválidos' }

  const prisma = await db()
  const vt = await prisma.verificationToken.findUnique({ where: { token } })

  if (!vt || vt.tipo !== 'RESET_SENHA') return { erro: 'Link inválido' }
  if (vt.usadoEm)                        return { erro: 'Link já utilizado' }
  if (vt.expiresAt < new Date())         return { erro: 'Link expirado' }
  if (!vt.userId)                        return { erro: 'Link inválido' }

  const senhaHash = await hash(novaSenha, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { id: vt.userId }, data: { senhaHash } }),
    prisma.verificationToken.update({ where: { token }, data: { usadoEm: new Date() } }),
    // Invalida todas as sessões ativas
    prisma.session.deleteMany({ where: { userId: vt.userId } }),
  ])

  return {}
}

export async function enviarConvite(params: {
  academiaId: string
  email: string
  papel: string
  academiaNome: string
  convidadoPor: string
}): Promise<{ erro?: string }> {
  const prisma = await db()

  // Verificar se já existe convite pendente
  const existente = await prisma.convite.findFirst({
    where: {
      academiaId: params.academiaId,
      email:      params.email.toLowerCase(),
      aceitoEm:   null,
      expiresAt:  { gt: new Date() },
    },
  })
  if (existente) return { erro: 'Convite pendente já enviado para este e-mail' }

  const token = nanoid(48)
  const url   = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link  = `${url}/convite?token=${token}`

  await prisma.convite.create({
    data: {
      academiaId: params.academiaId,
      email:      params.email.toLowerCase(),
      papel:      params.papel as any,
      token,
      expiresAt:  addDays(new Date(), 2),
    },
  })

  await sendEmail({
    to:      params.email,
    subject: `Convite para ${params.academiaNome} — OneMoreFit`,
    html:    emailConvite(link, params.academiaNome, params.papel),
    text:    `Acesse: ${link}`,
  })

  return {}
}
