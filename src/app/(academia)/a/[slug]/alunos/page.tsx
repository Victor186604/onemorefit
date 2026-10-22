import type { Metadata } from 'next'
import Link from 'next/link'
import { FiltroSelect } from '@/components/FiltroSelect'
import { getAcademiaSession } from '@/server/auth/session'
import { assertPermissao } from '@/server/permissions'
import { db } from '@/server/db/client'
import { UserPlus, Search } from 'lucide-react'
import { formatarData } from '@/lib/utils'

export const metadata: Metadata = { title: 'Alunos' }

interface Props {
  params: { slug: string }
  searchParams: { q?: string; situacao?: string; pagina?: string }
}

const POR_PAGINA = 20

export default async function AlunosPage({ params, searchParams }: Props) {
  const session = await getAcademiaSession(params.slug)
  assertPermissao(session.papel, 'alunos.ver')

  const prisma      = await db()
  const academiaId  = session.academia.id
  const pagina      = Number(searchParams.pagina ?? 1)
  const busca       = searchParams.q?.trim() ?? ''
  const situacao    = searchParams.situacao as any

  const where = {
    academiaId,
    ...(situacao ? { situacao } : {}),
    ...(busca ? {
      OR: [
        { nome:     { contains: busca, mode: 'insensitive' as const } },
        { email:    { contains: busca, mode: 'insensitive' as const } },
        { telefone: { contains: busca } },
        { cpf:      { contains: busca } },
      ],
    } : {}),
  }

  const [alunos, total] = await Promise.all([
    prisma.aluno.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip:  (pagina - 1) * POR_PAGINA,
      take:  POR_PAGINA,
      select: {
        id: true, nome: true, email: true, telefone: true,
        situacao: true, createdAt: true,
        matriculas: {
          where: { situacao: 'ATIVA' },
          select: { situacao: true, planoNome: true },
          take: 1,
        },
      },
    }),
    prisma.aluno.count({ where }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const base = `/a/${params.slug}/alunos`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 text-sm mt-1">{total} aluno{total !== 1 ? 's' : ''}</p>
        </div>
        {(session.papel === 'ADMIN' || session.papel === 'RECEPCAO') && (
          <Link
            href={`${base}/novo`}
            className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <UserPlus size={16} />
            Novo aluno
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <form className="flex-1 flex gap-2 min-w-64">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="q"
              defaultValue={busca}
              placeholder="Nome, e-mail, CPF ou telefone"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button type="submit" className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800">
            Buscar
          </button>
        </form>
        <FiltroSelect param="situacao" valor={situacao ?? ''}>
          <option value="">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="BLOQUEADO">Bloqueados</option>
        </FiltroSelect>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contato</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plano atual</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cadastro</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              )}
              {alunos.map(aluno => {
                const matriculaAtiva = aluno.matriculas[0]
                return (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`${base}/${aluno.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {aluno.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div>{aluno.email ?? '—'}</div>
                      <div className="text-xs">{aluno.telefone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {matriculaAtiva?.planoNome ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatarData(aluno.createdAt)}</td>
                    <td className="px-4 py-3">
                      <SituacaoBadge situacao={aluno.situacao} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Página {pagina} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              {pagina > 1 && (
                <Link href={`${base}?${new URLSearchParams({ ...searchParams, pagina: String(pagina - 1) })}`}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Anterior
                </Link>
              )}
              {pagina < totalPaginas && (
                <Link href={`${base}?${new URLSearchParams({ ...searchParams, pagina: String(pagina + 1) })}`}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SituacaoBadge({ situacao }: { situacao: string }) {
  const map: Record<string, string> = {
    ATIVO:    'bg-green-100 text-green-700',
    INATIVO:  'bg-gray-100 text-gray-600',
    BLOQUEADO:'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    ATIVO: 'Ativo', INATIVO: 'Inativo', BLOQUEADO: 'Bloqueado',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[situacao] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[situacao] ?? situacao}
    </span>
  )
}
