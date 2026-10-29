import type { Metadata } from 'next'
import Link from 'next/link'
import { getSessionUser } from '@/server/auth/session'
import { signOut } from '@/server/auth'
import { AuthShell } from '@/components/layout/AuthShell'
import { botaoCls } from '@/components/ui/Botao'

export const metadata: Metadata = { title: 'Acesso suspenso' }

export default async function AcademiaSuspensaPage() {
  await getSessionUser()
  return (
    <AuthShell subtitulo="Acesso indisponível">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso suspenso</h2>
      <p className="text-sm text-gray-600 mb-6">
        O acesso desta academia ao OneMoreFit está suspenso no momento. Os dados continuam preservados.
        Fale com o responsável pela academia para mais informações.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/selecionar-academia" className={botaoCls('secundario')}>Trocar de academia</Link>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
          <button type="submit" className={botaoCls('secundario')}>Sair</button>
        </form>
      </div>
    </AuthShell>
  )
}
