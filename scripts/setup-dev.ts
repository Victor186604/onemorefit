/**
 * Prepara o banco local (PGlite): cria as tabelas a partir do schema.prisma
 * e, em seguida, roda o seed de demonstração.
 *
 * Uso (com o "npm run dev" PARADO):
 *   npm run db:setup
 *
 * Não precisa de banco online: o SQL é gerado pelo Prisma a partir do schema
 * e aplicado diretamente no PGlite.
 */
import { PGlite } from '@electric-sql/pglite'
import { execSync } from 'child_process'

async function main() {
  if (process.env.DATABASE_URL) {
    console.error('DATABASE_URL está definida. Este script é só para o banco local (PGlite).')
    console.error('Para banco online, use: npm run db:migrate:deploy')
    process.exit(1)
  }

  const pglite = new PGlite('.pglite')

  const res = await pglite.query<{ existe: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'
     ) AS existe`
  )

  if (res.rows[0]?.existe) {
    console.log('Tabelas já existem — pulando criação.')
  } else {
    console.log('Gerando SQL a partir do prisma/schema.prisma...')
    const sql = execSync(
      'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit'] }
    )

    console.log('Criando tabelas no PGlite...')
    await pglite.exec(sql)
    console.log('Tabelas criadas.')
  }

  // Libera o arquivo do banco antes de o seed abrir outra conexão
  await pglite.close()

  console.log('\nRodando seed de demonstração...')
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })

  console.log('\nPronto! Agora rode: npm run dev')
}

main().catch(e => {
  console.error('Erro no setup:', e.message)
  process.exit(1)
})
