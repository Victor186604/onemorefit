import type { PrismaClient } from '@prisma/client'

interface AuditParams {
  prisma: PrismaClient
  academiaId?: string
  userId?: string
  nomeUser?: string
  acao: string
  entidade: string
  entidadeId?: string
  descricao?: string
  ip?: string
}

export async function audit(params: AuditParams) {
  try {
    await params.prisma.auditLog.create({
      data: {
        academiaId: params.academiaId,
        userId:     params.userId,
        nomeUser:   params.nomeUser,
        acao:       params.acao,
        entidade:   params.entidade,
        entidadeId: params.entidadeId,
        descricao:  params.descricao,
        ip:         params.ip,
      },
    })
  } catch {
    // Auditoria nunca deve derrubar a operação principal
    console.error('[audit] Falha ao registrar log de auditoria')
  }
}
