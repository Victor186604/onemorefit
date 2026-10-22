import { getAcademiaSession } from '@/server/auth/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function AcademiaLayout({ children, params }: Props) {
  const session = await getAcademiaSession(params.slug)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar slug={params.slug} papel={session.papel} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          academiaNome={session.academia.nome}
          userNome={session.user.nome}
          slug={params.slug}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
