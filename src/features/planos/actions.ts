'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { audit } from '@/server/services/audit'
import { z } from 'zod'

const planoSchema = z.object({
  id:            z.string().optional(),
  academiaId:    z.string(),
  nome:          z.string().min(2, 'Nome obrigatório'),
  descricao:     z.string().optional(),
  modalidade:    z.string().optional(),
  tipoDuracao:   z.enum(['MENSAL_RECORRENTE', 'CONTRATO_PRAZO']),
  duracaoMeses:  z.coerce.number().int().positive().optional().nullable(),
  valor:         z.coerce.number().positive('Valor obrigatório'),
  taxaMatricula: z.coerce.number().nonnegative().optional().nullable(),
  disponivelNovo:z.boolean().default(true),
  ativo:         z.boolean().default(true),
})

export async function salvarPlano(input: unknown): Promise<{ id?: string; erro?: string }> {
  const parsed = planoSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || vinculo.papel !== 'ADMIN') return { erro: 'Sem permissão' }

  if (d.tipoDuracao === 'CONTRATO_PRAZO' && !d.duracaoMeses) {
    return { erro: 'Informe a duração em meses para contratos com prazo' }
  }

  const dados = {
    nome:          d.nome,
    descricao:     d.descricao || null,
    modalidade:    d.modalidade || null,
    tipoDuracao:   d.tipoDuracao,
    duracaoMeses:  d.tipoDuracao === 'CONTRATO_PRAZO' ? d.duracaoMeses : null,
    valor:         d.valor,
    taxaMatricula: d.taxaMatricula ?? null,
    disponivelNovo:d.disponivelNovo,
    ativo:         d.ativo,
  }

  if (d.id) {
    await prisma.plano.update({ where: { id: d.id }, data: dados })
    await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
      acao: 'EDITAR', entidade: 'Plano', entidadeId: d.id, descricao: `Editou plano ${d.nome}` })
    return { id: d.id }
  }

  const plano = await prisma.plano.create({ data: { ...dados, academiaId: d.academiaId } })
  await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'CRIAR', entidade: 'Plano', entidadeId: plano.id, descricao: `Criou plano ${d.nome}` })
  return { id: plano.id }
}
