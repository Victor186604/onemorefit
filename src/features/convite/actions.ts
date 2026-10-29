'use server'

import { hash } from 'bcryptjs'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { db } from '@/server/db/client'
import { auth } from '@/server/auth'
import { audit } from '@/server/services/audit'
import { hashToken } from '@/lib/tokens'

type Resultado = { erro?: string; slug?: string; email?: string }

class ErroConvite extends Error {}

/**
 * Valida o convite DENTRO da transação e marca como aceito de forma atômica.
 * Se dois cliques chegarem juntos, só um consegue marcar (o outro recebe "já utilizado").
 */
async function consumirConvite(tx: Prisma.TransactionClient, token: string) {
  const convite = await tx.convite.findUnique({
    where: { token: hashToken(token) },
    include: { academia: { select: { id: true, slug: true, nome: true, situacao: true } } },
  })
  if (!convite)                             throw new ErroConvite('Convite inválido.')
  if (convite.aceitoEm)                     throw new ErroConvite('Este convite já foi utilizado.')
  if (convite.expiresAt <= new Date())      throw new ErroConvite('Este convite expirou. Peça um novo convite.')
  if (convite.academia.situacao !== 'ATIVA') throw new ErroConvite('O acesso desta academia está indisponível no momento.')

  const marcado = await tx.convite.updateMany({
    where: { id: convite.id, aceitoEm: null },
    data:  { aceitoEm: new Date() },
  })
  if (marcado.count !== 1) throw new ErroConvite('Este convite já foi utilizado.')
  return convite
}

async function vincular(tx: Prisma.TransactionClient, userId: string, academiaId: string, papel: Prisma.UserAcademiaCreateInput['papel']) {
  await tx.userAcademia.upsert({
    where:  { userId_academiaId: { userId, academiaId } },
    update: { papel, ativo: true },
    create: { userId, academiaId, papel },
  })
}

// ─── Quem ainda não tem conta ──────────────────────────────

const novaContaSchema = z.object({
  token: z.string().min(20).max(200),
  nome:  z.string().trim().min(2, 'Informe seu nome').max(120),
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres').max(72, 'Senha longa demais'),
})

export async function aceitarConviteNovaConta(input: unknown): Promise<Resultado> {
  const parsed = novaContaSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  const { token, nome, senha } = parsed.data

  const prisma    = await db()
  const senhaHash = await hash(senha, 12)

  try {
    const r = await prisma.$transaction(async (tx) => {
      const convite = await consumirConvite(tx, token)

      const existente = await tx.user.findUnique({ where: { email: convite.email }, select: { id: true } })
      if (existente) throw new ErroConvite('Já existe uma conta com este e-mail. Entre com sua senha para aceitar o convite.')

      const user = await tx.user.create({ data: { nome, email: convite.email, senhaHash } })
      await vincular(tx, user.id, convite.academiaId, convite.papel)
      return { user, convite }
    })

    await audit({
      prisma, academiaId: r.convite.academiaId, userId: r.user.id, nomeUser: r.user.nome,
      acao: 'ACEITAR', entidade: 'Convite', entidadeId: r.convite.id,
      descricao: `${r.convite.email} criou a conta e aceitou o convite (${r.convite.papel})`,
    })
    return { slug: r.convite.academia.slug, email: r.convite.email }
  } catch (e) {
    if (e instanceof ErroConvite) return { erro: e.message }
    if ((e as { code?: string })?.code === 'P2002') return { erro: 'Já existe uma conta com este e-mail. Entre com sua senha para aceitar o convite.' }
    console.error('[convite] Erro ao criar conta:', (e as Error).message)
    return { erro: 'Não foi possível concluir. Tente novamente.' }
  }
}

// ─── Quem já tem conta e está logado ───────────────────────

export async function aceitarConviteLogado(token: string): Promise<Resultado> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return { erro: 'Convite inválido.' }

  const sessao = await auth()
  if (!sessao?.user?.id) return { erro: 'Entre na sua conta para aceitar o convite.' }

  const prisma = await db()
  const user = await prisma.user.findUnique({
    where: { id: sessao.user.id }, select: { id: true, nome: true, email: true, ativo: true },
  })
  if (!user || !user.ativo) return { erro: 'Sua conta está desativada.' }

  try {
    const convite = await prisma.$transaction(async (tx) => {
      const c = await consumirConvite(tx, token)
      // O convite é para um e-mail específico: outra conta não pode aceitar
      if (c.email !== user.email.toLowerCase()) {
        throw new ErroConvite('Este convite foi enviado para outro e-mail.')
      }
      await vincular(tx, user.id, c.academiaId, c.papel)
      return c
    })

    await audit({
      prisma, academiaId: convite.academiaId, userId: user.id, nomeUser: user.nome,
      acao: 'ACEITAR', entidade: 'Convite', entidadeId: convite.id,
      descricao: `${convite.email} aceitou o convite (${convite.papel})`,
    })
    return { slug: convite.academia.slug }
  } catch (e) {
    if (e instanceof ErroConvite) return { erro: e.message }
    console.error('[convite] Erro ao aceitar:', (e as Error).message)
    return { erro: 'Não foi possível concluir. Tente novamente.' }
  }
}
