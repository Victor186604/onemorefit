'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { audit } from '@/server/services/audit'
import { registrarRecebimento } from '@/server/services/mensalidades'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

const recebimentoSchema = z.object({
  mensalidadeId: z.string(),
  academiaId:    z.string(),
  valor:         z.coerce.number().positive('Valor deve ser positivo'),
  formaPgtoId:   z.string().optional(),
  contaId:       z.string().optional(),
  dataPagamento: z.string(),
  observacoes:   z.string().optional(),
})

export async function receberMensalidade(input: unknown): Promise<{ erro?: string }> {
  const parsed = recebimentoSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || !['ADMIN', 'FINANCEIRO'].includes(vinculo.papel)) {
    return { erro: 'Sem permissão' }
  }

  // Verificar que a mensalidade pertence à academia
  const mens = await prisma.mensalidade.findFirst({
    where: { id: d.mensalidadeId, academiaId: d.academiaId },
    select: { id: true },
  })
  if (!mens) return { erro: 'Mensalidade não encontrada' }

  const formaPgto = d.formaPgtoId
    ? await prisma.formaPagamento.findFirst({ where: { id: d.formaPgtoId, academiaId: d.academiaId } })
    : null

  try {
    await registrarRecebimento(prisma, {
      mensalidadeId: d.mensalidadeId,
      academiaId:    d.academiaId,
      valor:         new Decimal(d.valor),
      formaPgtoId:   d.formaPgtoId,
      formaPgtoNome: formaPgto?.nome,
      contaId:       d.contaId,
      dataPagamento: new Date(d.dataPagamento),
      observacoes:   d.observacoes,
      userId:        user.id,
    })
  } catch (e: any) {
    return { erro: e.message }
  }

  await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'RECEBIMENTO', entidade: 'Mensalidade', entidadeId: d.mensalidadeId,
    descricao: `Recebimento de R$ ${d.valor.toFixed(2)}` })

  return {}
}

export async function estornarRecebimento(input: {
  recebimentoId: string
  academiaId:    string
  motivo:        string
}): Promise<{ erro?: string }> {
  const user   = await getSessionUser()
  const prisma = await db()

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: input.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || !['ADMIN', 'FINANCEIRO'].includes(vinculo.papel)) {
    return { erro: 'Sem permissão' }
  }

  const rec = await prisma.recebimento.findFirst({
    where: { id: input.recebimentoId, academiaId: input.academiaId },
  })
  if (!rec) return { erro: 'Recebimento não encontrado' }
  if (rec.estornado) return { erro: 'Já estornado' }

  await prisma.$transaction(async (tx) => {
    // Marcar como estornado
    await tx.recebimento.update({
      where: { id: input.recebimentoId },
      data: {
        estornado:     true,
        estornoMotivo: input.motivo,
        estornadoPor:  user.id,
        estornadoEm:   new Date(),
      },
    })

    // Recalcular valorRecebido e situação
    const recebimentos = await tx.recebimento.findMany({
      where: { mensalidadeId: rec.mensalidadeId, estornado: false },
      select: { valor: true },
    })
    const mens = await tx.mensalidade.findUnique({ where: { id: rec.mensalidadeId } })
    if (!mens) throw new Error('Mensalidade não encontrada')

    const total     = recebimentos.reduce((s, r) => s.plus(r.valor.toString()), new Decimal(0))
    const valorDev  = new Decimal(mens.valorOriginal.toString()).minus(mens.desconto.toString()).plus(mens.acrescimo.toString())
    const situacao  = total.lte(0) ? 'EM_ABERTO' : total.gte(valorDev) ? 'PAGA' : 'PARCIAL'

    await tx.mensalidade.update({
      where: { id: rec.mensalidadeId },
      data:  { valorRecebido: total, situacao },
    })
  })

  await audit({ prisma, academiaId: input.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'ESTORNO', entidade: 'Recebimento', entidadeId: input.recebimentoId,
    descricao: `Estorno: ${input.motivo}` })

  return {}
}
