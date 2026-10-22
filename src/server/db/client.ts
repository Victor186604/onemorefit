/**
 * Conexão do banco de dados.
 *
 * LOCAL (DATABASE_URL vazia): PGlite — PostgreSQL em WebAssembly, dados em .pglite/
 * PRODUÇÃO / PREVIEW (DATABASE_URL preenchida): PostgreSQL online (Neon) via pg.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  let client: PrismaClient

  if (!process.env.DATABASE_URL) {
    const { PGlite }       = await import('@electric-sql/pglite')
    const { PrismaPGlite } = await import('pglite-prisma-adapter')

    const pglite = new PGlite('.pglite')
    client = new PrismaClient({ adapter: new PrismaPGlite(pglite) })
  } else {
    const { PrismaPg } = await import('@prisma/adapter-pg')

    client = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 10,
      }),
    })
  }

  globalForPrisma.prisma = client
  return client
}

export async function db() {
  return getPrisma()
}
