/** Endereço do painel da academia: /a/[slug] */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}
