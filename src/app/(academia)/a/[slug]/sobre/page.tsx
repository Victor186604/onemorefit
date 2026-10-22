import type { Metadata } from 'next'
import { getAcademiaSession } from '@/server/auth/session'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Sobre' }

export default async function SobrePage({ params }: { params: { slug: string } }) {
  await getAcademiaSession(params.slug)
  const versao = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sobre</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2><Logo largura={220} /></h2>
          <p className="text-gray-500 text-sm mt-3">Gestão para academias e estúdios</p>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Versão</span>
            <span className="font-medium">{versao}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Desenvolvido por</span>
            <span className="font-medium">OneMoreCode</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Plataforma</span>
            <span className="font-medium">Web (SaaS)</span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Este software é proprietário e de uso exclusivo dos clientes da OneMoreCode.
          Todos os direitos reservados.
        </p>

        <div className="pt-2 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} OneMoreCode. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
