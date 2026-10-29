'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { audit } from '@/server/services/audit'
import { gerarMensalidadesMatricula } from '@/server/services/mensalidades'
import { z } from 'zod'
import { addMonths } from 'date-fns'

const novaMatriculaSchema = z.object({
  academiaId:      z.string(),
  alunoId:         z.string(),
  planoId:         z.string(),
  diaVencimento:   z.coerce.number().int().min(1).max(31),
  dataInicio:      z.string(),
  valorContratado: z.coerce.number().positive(),
  desconto:        z.coerce.number().nonnegative().optional(),
  formaPgtoId:     z.string().optional(),
  observacoes:     z.string().optional(),
  gerarTaxaMatricula: z.boolean().default(false),
})

export async function criarMatricula(input: unknown): Promise<{ id?: string; erro?: string }> {
  const parsed = novaMatriculaSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  // Verificar vínculo
  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || !['ADMIN', 'RECEPCAO'].includes(vinculo.papel)) {
    return { erro: 'Sem permissão' }
  }

  // Verificar aluno e plano pertencem à academia
  const [aluno, plano] = await Promise.all([
    prisma.aluno.findFirst({ where: { id: d.alunoId, academiaId: d.academiaId } }),
    prisma.plano.findFirst({ where: { id: d.planoId, academiaId: d.academiaId } }),
  ])
  if (!aluno) return { erro: 'Aluno não encontrado' }
  if (!plano) return { erro: 'Plano não encontrado' }

  const dataInicio  = new Date(d.dataInicio)
  const dataTermino = plano.tipoDuracao === 'CONTRATO_PRAZO' && plano.duracaoMeses
    ? addMonths(dataInicio, plano.duracaoMeses)
    : null

  const matricula = await prisma.$transaction(async (tx) => {
    const mat = await tx.matricula.create({
      data: {
        academiaId:      d.academiaId,
        alunoId:         d.alunoId,
        planoId:         d.planoId,
        planoNome:       plano.nome,
        planoTipo:       plano.tipoDuracao,
        valorContratado: d.valorContratado,
        taxaMatricula:   d.gerarTaxaMatricula && plano.taxaMatricula ? plano.taxaMatricula : null,
        diaVencimento:   d.diaVencimento,
        desconto:        d.desconto ?? 0,
        formaPgtoId:     d.formaPgtoId || null,
        dataInicio,
        dataTermino,
        situacao:        'ATIVA',
        observacoes:     d.observacoes || null,
      },
      include: { plano: true },
    })

    await tx.matriculaHistorico.create({
      data: {
        matriculaId: mat.id,
        evento:      'CRIACAO',
        descricao:   `Matrícula criada no plano ${plano.nome}`,
        userId:      user.id,
        nomeUser:    user.nome,
      },
    })

    // Taxa de matrícula
    if (d.gerarTaxaMatricula && plano.taxaMatricula) {
      await tx.mensalidade.create({
        data: {
          academiaId:    d.academiaId,
          matriculaId:   mat.id,
          tipo:          'TAXA_MATRICULA',
          competencia:   `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, '0')}`,
          vencimento:    dataInicio,
          valorOriginal: plano.taxaMatricula,
          desconto:      0,
          acrescimo:     0,
          valorRecebido: 0,
          situacao:      'EM_ABERTO',
        },
      })
    }

    return mat
  })

  // Gerar mensalidades (fora da transação principal para evitar timeout)
  await gerarMensalidadesMatricula(prisma, matricula as any)

  await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'CRIAR', entidade: 'Matricula', entidadeId: matricula.id,
    descricao: `Matriculou ${aluno.nome} no plano ${plano.nome}` })

  return { id: matricula.id }
}

export async function cancelarMatricula(input: {
  matriculaId: string
  academiaId:  string
  motivo:      string
}): Promise<{ erro?: string }> {
  const user   = await getSessionUser()
  const prisma = await db()

  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: input.academiaId } },
  })
  if (!vinculo || !vinculo.ativo || vinculo.papel !== 'ADMIN') return { erro: 'Sem permissão' }

  const matricula = await prisma.matricula.findFirst({
    where: { id: input.matriculaId, academiaId: input.academiaId },
  })
  if (!matricula) return { erro: 'Matrícula não encontrada' }
  if (matricula.situacao !== 'ATIVA') return { erro: 'Apenas matrículas ativas podem ser canceladas' }

  const hoje = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.matricula.update({
      where: { id: input.matriculaId },
      data:  { situacao: 'CANCELADA' },
    })

    // Cancelar mensalidades futuras sem recebimentos
    const futuras = await tx.mensalidade.findMany({
      where: {
        matriculaId: input.matriculaId,
        situacao:    'EM_ABERTO',
        vencimento:  { gt: hoje },
        valorRecebido: 0,
      },
    })

    for (const m of futuras) {
      await tx.mensalidade.update({
        where: { id: m.id },
        data: {
          situacao:     'CANCELADA',
          canceladaEm:  hoje,
          canceladaPor: user.id,
          cancelMotivo: `Cancelamento da matrícula: ${input.motivo}`,
        },
      })
    }

    await tx.matriculaHistorico.create({
      data: {
        matriculaId: input.matriculaId,
        evento:      'CANCELAMENTO',
        descricao:   input.motivo,
        userId:      user.id,
        nomeUser:    user.nome,
      },
    })
  })

  await audit({ prisma, academiaId: input.academiaId, userId: user.id, nomeUser: user.nome,
    acao: 'CANCELAR', entidade: 'Matricula', entidadeId: input.matriculaId,
    descricao: `Cancelou matrícula: ${input.motivo}` })

  return {}
}
