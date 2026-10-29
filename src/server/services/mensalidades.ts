import type { PrismaClient, Matricula } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { addMonths, setDate, getDaysInMonth, parseISO, format } from 'date-fns'

/**
 * Calcula a data de vencimento para um dado mês/ano e dia preferido.
 * Se o dia não existir no mês, usa o último dia do mês.
 */
export function calcularVencimento(ano: number, mes: number, dia: number): Date {
  const diasNoMes = getDaysInMonth(new Date(ano, mes - 1, 1))
  const diaReal   = Math.min(dia, diasNoMes)
  return new Date(ano, mes - 1, diaReal)
}

/**
 * Gera mensalidades pendentes para uma matrícula.
 * Usa transação e constraint única para evitar duplicatas.
 * Regra: competência = "YYYY-MM", primeira competência = mês de início.
 */
export async function gerarMensalidadesMatricula(
  prisma: PrismaClient,
  matricula: Matricula & { plano: { tipoDuracao: string } },
  ateData?: Date,
): Promise<number> {
  const hoje     = new Date()
  const limite   = ateData ?? addMonths(hoje, 1)
  const inicio   = typeof matricula.dataInicio === 'string'
    ? parseISO(matricula.dataInicio as unknown as string)
    : matricula.dataInicio

  let geradas = 0

  // Mês corrente de iteração
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)

  while (cursor <= limite) {
    const competencia = format(cursor, 'yyyy-MM')
    const vencimento  = calcularVencimento(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      matricula.diaVencimento,
    )

    // Verificar se o contrato já terminou
    if (matricula.dataTermino) {
      const termino = typeof matricula.dataTermino === 'string'
        ? parseISO(matricula.dataTermino as unknown as string)
        : matricula.dataTermino
      if (cursor > termino) break
    }

    // Tentar inserir — ignora se já existir (constraint única)
    try {
      await prisma.mensalidade.create({
        data: {
          academiaId:    matricula.academiaId,
          matriculaId:   matricula.id,
          tipo:          'MENSALIDADE',
          competencia,
          vencimento,
          valorOriginal: matricula.valorContratado,
          desconto:      matricula.desconto ?? new Decimal(0),
          acrescimo:     new Decimal(0),
          valorRecebido: new Decimal(0),
          situacao:      'EM_ABERTO',
        },
      })
      geradas++
    } catch (e: any) {
      if (e?.code !== 'P2002') throw e // P2002 = unique constraint
    }

    cursor = addMonths(cursor, 1)
  }

  return geradas
}

/**
 * Registra um recebimento parcial ou total de uma mensalidade.
 * Usa transação para garantir consistência.
 */
export async function registrarRecebimento(
  prisma: PrismaClient,
  params: {
    mensalidadeId: string
    academiaId:    string
    valor:         Decimal
    formaPgtoId?:  string
    formaPgtoNome?: string
    contaId?:      string
    dataPagamento: Date
    observacoes?:  string
    userId:        string
  },
) {
  return prisma.$transaction(async (tx) => {
    const mens = await tx.mensalidade.findUnique({
      where: { id: params.mensalidadeId },
      select: {
        id: true, academiaId: true, situacao: true,
        valorOriginal: true, desconto: true, acrescimo: true, valorRecebido: true,
      },
    })

    if (!mens) throw new Error('Mensalidade não encontrada')
    if (mens.academiaId !== params.academiaId) throw new Error('Acesso negado')
    if (mens.situacao === 'CANCELADA') throw new Error('Mensalidade cancelada')
    if (mens.situacao === 'PAGA') throw new Error('Mensalidade já está paga')

    const valorDevido = new Decimal(mens.valorOriginal.toString())
      .minus(mens.desconto.toString())
      .plus(mens.acrescimo.toString())
    const jaRecebido  = new Decimal(mens.valorRecebido.toString())
    const saldo       = valorDevido.minus(jaRecebido)

    if (params.valor.lte(0)) throw new Error('Valor deve ser positivo')
    if (params.valor.gt(saldo)) throw new Error(`Valor excede o saldo de ${saldo.toFixed(2)}`)

    const recebimento = await tx.recebimento.create({
      data: {
        mensalidadeId: params.mensalidadeId,
        academiaId:    params.academiaId,
        valor:         params.valor,
        formaPgtoId:   params.formaPgtoId,
        formaPgtoNome: params.formaPgtoNome,
        contaId:       params.contaId,
        dataPagamento: params.dataPagamento,
        observacoes:   params.observacoes,
        registradoPor: params.userId,
      },
    })

    const novoRecebido = jaRecebido.plus(params.valor)
    const situacao     = novoRecebido.gte(valorDevido) ? 'PAGA' : 'PARCIAL'

    await tx.mensalidade.update({
      where: { id: params.mensalidadeId },
      data:  { valorRecebido: novoRecebido, situacao },
    })

    return recebimento
  })
}
