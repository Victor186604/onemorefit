import type { Metadata } from 'next'
import { requirePlatformAdmin } from '@/server/auth/guards'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { NovaAcademiaForm } from '@/features/plataforma/NovaAcademiaForm'

export const metadata: Metadata = { title: 'Nova academia' }

export default async function NovaAcademiaPage() {
  await requirePlatformAdmin()
  return (
    <div className="max-w-2xl">
      <Breadcrumbs itens={[{ label: 'Academias', href: '/plataforma/academias' }, { label: 'Nova academia' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova academia</h1>
      <p className="text-sm text-gray-500 mb-6">
        A academia já é criada com formas de pagamento, conta “Caixa” e categorias financeiras padrão.
      </p>
      <NovaAcademiaForm />
    </div>
  )
}
