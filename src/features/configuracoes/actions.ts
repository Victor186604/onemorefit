'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { audit } from '@/server/services/audit'
import { z } from 'zod'

const schema = z.object({
  academiaId:   z.string(),
  nome:         z.string().min(2),
  email:        z.string().email().optional().or(z.literal('')),
  telefone:     z.string().optional(),
  cnpj:         z.string().optional(),
  endereco:     z.string().optional(),
  cidade:       z.string().optional(),
  estado:       z.string().optional(),
  cep:          z.string().optional(),
  fuso:         z.string(),
  logoUrl:      z.string().url().optional().or(z.literal('')),
  reciboHeader: z.string().optional(),
  reciboFooter: z.string().optional(),
})

export async function salvarConfigAcademia(input: unknown): Promise<{ erro?: string }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || vinculo.papel !== 'ADMIN') return { erro: 'Sem permissão' }

  // Validar logoUrl — apenas HTTPS
  if (d.logoUrl && !d.logoUrl.startsWith('https://')) {
    return { erro: 'O logotipo deve usar URL HTTPS' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.academia.update({
      where: { id: d.academiaId },
      data: {
        nome:     d.nome,
        email:    d.email || null,
        telefone: d.telefone || null,
        cnpj:     d.cnpj || null,
        endereco: d.endereco || null,
        cidade:   d.cidade || null,
        estado:   d.estado || null,
        cep:      d.cep || null,
        fuso:     d.fuso,
        logoUrl:  d.logoUrl || null,
      },
    })

    await tx.academiaConfig.upsert({
      where:  { academiaId: d.academiaId },
      update: { reciboHeader: d.reciboHeader || null, reciboFooter: d.reciboFooter || null },
      create: {
        academiaId:   d.academiaId,
        reciboHeader: d.reciboHeader || null,
        reciboFooter: d.reciboFooter || null,
      },
    })
  })

  await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'EDITAR', entidade: 'Academia', entidadeId: d.academiaId,
    descricao: 'Atualizou configurações da academia' })

  return {}
}
