import { createHash, randomBytes } from 'crypto'

/**
 * Tokens de uso único (convites, redefinição de senha).
 * O link enviado leva o token; o banco guarda só o hash SHA-256.
 * Quem tiver acesso ao banco não consegue usar os links.
 */
export function gerarToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
