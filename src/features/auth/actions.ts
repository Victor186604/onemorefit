'use server'

import { db } from '@/server/db/client'
import { sendEmail, emailResetSenha } from '@/server/services/email'
import { gerarToken, hashToken } from '@/lib/tokens'
import { hash } from 'bcryptjs'
import { addHours } from 'date-fns'
import { z } from 'zod'

export async function solicitarResetSenha(email: string): Promise<{ erro?: string }> {
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { erro: 'E-mail inválido' }

  const prisma = await db()
  const user = await prisma.user.findUnique({ where: { email: parsed.data.toLowerCase() } })

  // Não revelar se o usuário existe
  if (!user || !user.ativo) return {}

  // Invalidar tokens anteriores
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, tipo: 'RESET_SENHA', usadoEm: null },
    data:  { usadoEm: new Date() },
  })

  // O link leva o token; o banco guarda só o hash
  const { token, hash: tokenHash } = gerarToken()
  await prisma.verificationToken.create({
    data: {
      token:     tokenHash,
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
  if (!token || typeof novaSenha !== 'string' || novaSenha.length < 8 || novaSenha.length > 72) {
    return { erro: 'Dados inválidos' }
  }

  const prisma    = await db()
  const tokenHash = hashToken(token)
  const vt = await prisma.verificationToken.findUnique({ where: { token: tokenHash } })

  if (!vt || vt.tipo !== 'RESET_SENHA') return { erro: 'Link inválido' }
  if (vt.usadoEm)                        return { erro: 'Link já utilizado' }
  if (vt.expiresAt < new Date())         return { erro: 'Link expirado' }
  if (!vt.userId)                        return { erro: 'Link inválido' }

  const senhaHash = await hash(novaSenha, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { id: vt.userId }, data: { senhaHash } }),
    prisma.verificationToken.update({ where: { token: tokenHash }, data: { usadoEm: new Date() } }),
  ])

  return {}
}
