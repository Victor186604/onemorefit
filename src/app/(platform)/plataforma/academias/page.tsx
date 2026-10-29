import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { db } from '@/server/db/client'
import { requirePlatformAdmin } from '@/server/auth/guards'
import { ASSINATURA, SITUACAO_ACADEMIA } from '@/lib/labels'
import { formatarData } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { botaoCls } from '@/components/ui/Botao'
import { inputCls } from '@/components/ui/Campo'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = { title: 'Academias' }
const POR_PAGINA = 20
const ASSINATURAS = Object.keys(ASSINATURA)

export default async function AcademiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; assinatura?: string; pagina?: string }>
}) {
  await requirePlatformAdmin()
  const sp     = await searchParams
  const busca  = sp.q?.trim() ?? ''
  const filtro = ASSINATURAS.includes(sp.assinatura ?? '') ? sp.assinatura : undefined
  const pagina = Math.max(1, Number(sp.pagina) || 1)
  const prisma = await db()

  const where: Prisma.AcademiaWhereInput = {
    ...(filtro ? { assinatura: filtro as Prisma.AcademiaWhereInput['assinatura'] } : {}),
    ...(busca ? { OR: [
      { nome:   { contains: busca, mode: 'insensitive' } },
      { slug:   { contains: busca.toLowerCase() } },
      { cidade: { contains: busca, mode: 'insensitive' } },
    ] } : {}),
  }

  const [academias, total] = await Promise.all([
    prisma.academia.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * POR_PAGINA, take: POR_PAGINA,
      select: { id: true, nome: true, slug: true, cidade: true, estado: true,
                situacao: true, assinatura: true, assinaturaAte: true, createdAt: true },
    }),
    prisma.academia.count({ where }),
  ])
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const link = (p: number) => {
    const qs = new URLSearchParams({ ...(busca ? { q: busca } : {}), ...(filtro ? { assinatura: filtro } : {}), pagina: String(p) })
    return `/plataforma/academias?${qs}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academias</h1>
          <p className="text-gray-500 text-sm mt-1">{total} academia{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/plataforma/academias/nova" className={botaoCls()}><Plus size={16} aria-hidden /> Nova academia</Link>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3" role="search">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <label htmlFor="q" className="sr-only">Buscar academia</label>
          <input id="q" name="q" defaultValue={busca} placeholder="Nome, endereço ou cidade" className={`${inputCls} pl-9`} />
        </div>
        <label htmlFor="assinatura" className="sr-only">Assinatura</label>
        <select id="assinatura" name="assinatura" defaultValue={filtro ?? ''} className={`${inputCls} w-auto`}>
          <option value="">Todas as assinaturas</option>
          {Object.entries(ASSINATURA).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button type="submit" className={botaoCls('secundario')}>Filtrar</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-600">
              <th scope="col" className="px-4 py-3 font-medium">Academia</th>
              <th scope="col" className="px-4 py-3 font-medium">Cidade</th>
              <th scope="col" className="px-4 py-3 font-medium">Acesso</th>
              <th scope="col" className="px-4 py-3 font-medium">Assinatura</th>
              <th scope="col" className="px-4 py-3 font-medium">Válida até</th>
              <th scope="col" className="px-4 py-3 font-medium">Criada em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {academias.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                {busca || filtro ? 'Nenhuma academia encontrada com esses filtros.' : 'Nenhuma academia cadastrada ainda.'}
              </td></tr>
            )}
            {academias.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/plataforma/academias/${a.id}`} className="font-medium text-gray-900 hover:text-brand-700">{a.nome}</Link>
                  <div className="text-xs text-gray-400">/a/{a.slug}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{[a.cidade, a.estado].filter(Boolean).join(' / ') || '—'}</td>
                <td className="px-4 py-3"><Badge cls={SITUACAO_ACADEMIA[a.situacao].cls}>{SITUACAO_ACADEMIA[a.situacao].label}</Badge></td>
                <td className="px-4 py-3"><Badge cls={ASSINATURA[a.assinatura].cls}>{ASSINATURA[a.assinatura].label}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{a.assinaturaAte ? formatarData(a.assinaturaAte) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatarData(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPaginas > 1 && (
          <nav aria-label="Paginação" className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && <Link href={link(pagina - 1)} className={botaoCls('secundario', 'px-3 py-1')}>Anterior</Link>}
              {pagina < totalPaginas && <Link href={link(pagina + 1)} className={botaoCls('secundario', 'px-3 py-1')}>Próxima</Link>}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
