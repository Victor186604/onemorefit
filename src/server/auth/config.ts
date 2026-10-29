/**
 * Configuração BASE do Auth.js — sem imports de banco de dados.
 * Usada pelo middleware (Edge Runtime) e pela configuração completa do servidor.
 * NÃO importe db/client.ts aqui.
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  providers: [],  // providers com DB ficam em auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      // /api/auth: rotas internas do próprio Auth.js (csrf, callback, session)
      // /api/cron: protegida por CRON_SECRET no middleware, não por sessão
      const isPublic = [
        '/login', '/redefinir-senha', '/convite', '/api/auth', '/api/cron',
      ].some(p => nextUrl.pathname.startsWith(p))
      if (isPublic) return true
      if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl))
      return true
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60,
  },
}
