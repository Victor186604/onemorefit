'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { z } from 'zod'

const schema = z.object({
  academiaId: z.string(),
  alunoId:    z.string(),
  userId:     z.string(),
})

export async function registrarPresenca(input: unknown): Promise<{ erro?: string }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { erro: 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || !['ADMIN', 'RECEPCAO'].includes(vinculo.papel)) {
    return { erro: 'Sem permissão' }
  }

  // Verificar aluno pertence à academia
  const aluno = await prisma.aluno.findFirst({
    where: { id: d.alunoId, academiaId: d.academiaId },
  })
  if (!aluno) return { erro: 'Aluno não encontrado' }

  const agora   = new Date()
  const inicio  = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const fim     = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1)

  // Verificar presença já registrada hoje (evitar duplicata acidental)
  // Janela de 30 minutos para a mesma visita
  const janela  = new Date(agora.getTime() - 30 * 60 * 1000)
  const recente = await prisma.presenca.findFirst({
    where: {
      academiaId: d.academiaId,
      alunoId:    d.alunoId,
      anuladaEm:  null,
      dataHora:   { gte: janela },
    },
  })
  if (recente) return { erro: 'Presença já registrada nos últimos 30 minutos' }

  try {
    await prisma.presenca.create({
      data: {
        academiaId:    d.academiaId,
        alunoId:       d.alunoId,
        dataHora:      agora,
        registradaPor: user.id,
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2002') return { erro: 'Presença já registrada neste horário' }
    throw e
  }

  return {}
}
