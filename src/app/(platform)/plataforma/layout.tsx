import { getSessionUser } from '@/server/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/server/auth'
import { Building2, Users, LayoutDashboard, LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user.isPlatformAdmin) redirect('/selecionar-academia')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-56 bg-sidebar flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <Logo variante="branca" largura={150} prioridade />
          <div className="text-slate-400 text-xs mt-2">Plataforma</div>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {[
            { href: '/plataforma', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/plataforma/academias', label: 'Academias', icon: Building2 },
            { href: '/plataforma/usuarios', label: 'Usuários', icon: Users },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }} className="p-3 border-t border-white/10">
          <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </form>
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <span className="text-sm font-medium text-gray-700">{user.nome}</span>
          <span className="ml-2 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Platform Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
