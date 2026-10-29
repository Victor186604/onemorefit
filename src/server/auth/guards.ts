import { notFound, redirect } from 'next/navigation'
import { getAcademiaSession, getSessionUser, type SessionUser } from './session'
import { podeAcessar, type Permissao } from '@/server/permissions'

/**
 * Páginas da plataforma OneMoreCode.
 * Use em TODA página de /plataforma (o layout sozinho não é barreira de segurança).
 */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user.isPlatformAdmin) redirect('/selecionar-academia')
  return user
}

/**
 * Server Actions da plataforma: devolve o usuário ou null (a action responde "Sem permissão").
 */
export async function platformAdminOuNull(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  return user.isPlatformAdmin ? user : null
}

/**
 * Páginas da academia: valida sessão, vínculo ativo e, se informada, a permissão.
 * Sem permissão responde 404, para não revelar que a página existe.
 */
export async function requireAcademia(slug: string, permissao?: Permissao) {
  const session = await getAcademiaSession(slug)
  if (permissao && !podeAcessar(session.papel, permissao)) notFound()
  return session
}
