import { getSessionUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/server/auth'
import { Building2 } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default async function SelecionarAcademiaPage() {
  const user   = await getSessionUser()
  const prisma = await db()

  if (user.isPlatformAdmin) redirect('/plataforma')

  const vinculos = await prisma.userAcademia.findMany({
    where:   { userId: user.id, ativo: true },
    include: { academia: { select: { id: true, nome: true, slug: true, situacao: true } } },
    orderBy: { academia: { nome: 'asc' } },
  })

  // Com uma só academia, entra direto (a não ser que esteja suspensa, para não criar um ciclo)
  if (vinculos.length === 1 && vinculos[0].academia.situacao === 'ATIVA') {
    redirect(`/a/${vinculos[0].academia.slug}/dashboard`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6"><Logo largura={200} prioridade /></div>
          <h1 className="text-2xl font-bold text-gray-900">Selecionar academia</h1>
          <p className="text-gray-500 text-sm mt-1">Olá, {user.nome}</p>
        </div>

        {vinculos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            Nenhuma academia vinculada à sua conta.
          </div>
        ) : (
          <div className="space-y-3">
            {vinculos.map(v => (
              <Link
                key={v.academia.id}
                href={`/a/${v.academia.slug}/dashboard`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-brand-700" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 group-hover:text-brand-700">
                    {v.academia.nome}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{v.papel.toLowerCase()}</div>
                </div>
                {v.academia.situacao === 'SUSPENSA' && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Suspensa</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
          className="mt-6 text-center"
        >
          <button type="submit" className="text-sm text-gray-400 hover:text-gray-600">
            Sair da conta
          </button>
        </form>
      </div>
    </main>
  )
}
