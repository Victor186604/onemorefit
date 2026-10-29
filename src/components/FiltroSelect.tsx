'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  param: string
  valor: string
  children: React.ReactNode
}

/** Filtro de listagem: atualiza o parâmetro na URL e volta para a página 1. */
export function FiltroSelect({ param, valor, children }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function alterar(novo: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (novo) params.set(param, novo)
    else params.delete(param)
    params.delete('pagina')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <select
      value={valor}
      onChange={e => alterar(e.target.value)}
      aria-label="Filtrar"
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      {children}
    </select>
  )
}
