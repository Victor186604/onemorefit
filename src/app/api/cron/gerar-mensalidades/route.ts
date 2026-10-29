import { NextResponse } from 'next/server'
import { db } from '@/server/db/client'
import { gerarMensalidadesMatricula } from '@/server/services/mensalidades'
import { addMonths } from 'date-fns'

/**
 * Cron job — geração de mensalidades futuras.
 * Protegido por CRON_SECRET via middleware.
 *
 * Vercel Cron (vercel.json):
 *   { "path": "/api/cron/gerar-mensalidades", "schedule": "0 6 * * *" }
 *
 * Cada execução é idempotente — a constraint única impede duplicatas.
 * Processa em lotes de 20 matrículas por execução.
 */
export async function GET() {
  const prisma  = await db()
  const limite  = addMonths(new Date(), 2) // gerar até 2 meses à frente
  let   geradas = 0
  let   erros   = 0

  const matriculas = await prisma.matricula.findMany({
    where:   { situacao: 'ATIVA' },
    include: { plano: true },
    take:    20, // lote pequeno — serverless tem tempo limitado
  })

  for (const mat of matriculas) {
    try {
      const n = await gerarMensalidadesMatricula(prisma, mat as any, limite)
      geradas += n
    } catch (e: any) {
      erros++
      console.error(`[cron] Erro na matrícula ${mat.id}:`, e.message)
    }
  }

  console.log(`[cron] gerar-mensalidades: ${geradas} geradas, ${erros} erros`)

  return NextResponse.json({
    ok:      true,
    geradas,
    erros,
    ts:      new Date().toISOString(),
  })
}
