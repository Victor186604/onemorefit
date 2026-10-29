import type { PapelAcademia, PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'
import { gerarToken } from '@/lib/tokens'
import { PAPEL_LABEL } from '@/lib/labels'
import { sendEmail, emailConvite } from './email'

export const VALIDADE_CONVITE_DIAS = 2

/**
 * Cria e envia um convite. NÃO verifica permissão: quem chama
 * (Server Action) é responsável por autorizar antes.
 *
 * - Convites pendentes anteriores para o mesmo e-mail e academia são invalidados
 *   (convidar de novo = reenviar).
 * - O banco guarda só o hash do token.
 */
export async function criarEnviarConvite(
  prisma: PrismaClient,
  params: { academiaId: string; academiaNome: string; email: string; papel: PapelAcademia },
): Promise<{ erro?: string; conviteId?: string }> {
  const email = params.email.trim().toLowerCase()
  const agora = new Date()

  // Já tem acesso ativo?
  const usuario = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (usuario) {
    const vinculo = await prisma.userAcademia.findUnique({
      where: { userId_academiaId: { userId: usuario.id, academiaId: params.academiaId } },
    })
    if (vinculo?.ativo) return { erro: 'Este e-mail já tem acesso a esta academia' }
  }

  const { token, hash } = gerarToken()

  const convite = await prisma.$transaction(async (tx) => {
    await tx.convite.updateMany({
      where: { academiaId: params.academiaId, email, aceitoEm: null, expiresAt: { gt: agora } },
      data:  { expiresAt: agora },
    })
    return tx.convite.create({
      data: {
        academiaId: params.academiaId,
        email,
        papel:      params.papel,
        token:      hash,
        expiresAt:  addDays(agora, VALIDADE_CONVITE_DIAS),
      },
    })
  })

  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link = `${base}/convite?token=${token}`

  try {
    await sendEmail({
      to:      email,
      subject: `Convite para ${params.academiaNome} — OneMoreFit`,
      html:    emailConvite(link, params.academiaNome, PAPEL_LABEL[params.papel]),
      text:    `Você foi convidado para ${params.academiaNome} no OneMoreFit. Acesse: ${link}`,
    })
  } catch (e) {
    // Sem e-mail entregue o convite é inútil: invalida para não ficar pendente "fantasma".
    await prisma.convite.update({ where: { id: convite.id }, data: { expiresAt: new Date() } })
    console.error('[convite] Falha no envio do e-mail:', (e as Error).message)
    return { erro: 'Não foi possível enviar o e-mail do convite. Tente novamente.' }
  }

  return { conviteId: convite.id }
}

export type SituacaoConvite = 'pendente' | 'aceito' | 'expirado'

export function situacaoConvite(c: { aceitoEm: Date | null; expiresAt: Date }): SituacaoConvite {
  if (c.aceitoEm) return 'aceito'
  return c.expiresAt > new Date() ? 'pendente' : 'expirado'
}
