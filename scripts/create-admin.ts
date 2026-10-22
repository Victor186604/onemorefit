/**
 * Cria o primeiro Platform Admin de produção de forma segura.
 *
 * Uso:
 *   npx tsx scripts/create-admin.ts
 *
 * Variáveis de ambiente necessárias: DATABASE_URL (ou PGlite local).
 * Solicita nome, e-mail e senha interativamente.
 * Nunca armazena senha em texto puro.
 */

import { getPrisma } from '../src/server/db/client'
import { hash } from 'bcryptjs'
import * as readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('ATENÇÃO: executando em produção. Certifique-se que o banco está correto.')
  }

  const rl   = readline.createInterface({ input, output })
  const nome  = await rl.question('Nome: ')
  const email = await rl.question('E-mail: ')
  const senha = await rl.question('Senha (mín. 8 caracteres): ')

  rl.close()

  if (!nome || !email || senha.length < 8) {
    console.error('Dados inválidos.')
    process.exit(1)
  }

  const prisma    = await getPrisma()
  const existing  = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (existing) {
    console.error(`Usuário com e-mail ${email} já existe.`)
    process.exit(1)
  }

  const senhaHash = await hash(senha, 12)
  const user      = await prisma.user.create({
    data: {
      nome,
      email:     email.toLowerCase(),
      senhaHash,
      platformAdmin: { create: {} },
    },
  })

  console.log(`\nPlatform Admin criado com sucesso!`)
  console.log(`ID: ${user.id}`)
  console.log(`E-mail: ${user.email}`)
}

main().catch(e => { console.error(e); process.exit(1) })
