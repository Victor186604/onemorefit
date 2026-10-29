/**
 * Auth.js completo — com provider Credentials e acesso ao banco.
 * Usado apenas em Server Components, Server Actions e Route Handlers.
 * NUNCA importe este arquivo no middleware.
 */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './config'
import { db } from '@/server/db/client'

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha',  type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const prisma = await db()
        const user   = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })

        if (!user || !user.senhaHash || !user.ativo) return null

        const valid = await compare(parsed.data.senha, user.senhaHash)
        if (!valid) return null

        return { id: user.id, name: user.nome, email: user.email }
      },
    }),
  ],
})
