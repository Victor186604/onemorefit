'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, ClipboardList,
  CreditCard, DollarSign, CheckSquare, BarChart2,
  Settings, Info, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { useState } from 'react'
import type { PapelAcademia } from '@prisma/client'
import { podeAcessar } from '@/server/permissions'
import { cn } from '@/lib/utils'
import { Logo, LogoIcone } from '@/components/brand/Logo'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permissao?: Parameters<typeof podeAcessar>[1]
}

function getNavItems(slug: string): NavItem[] {
  const base = `/a/${slug}`
  return [
    { href: `${base}/dashboard`,     label: 'Visão Geral',  icon: LayoutDashboard },
    { href: `${base}/alunos`,        label: 'Alunos',       icon: Users,         permissao: 'alunos.ver' },
    { href: `${base}/planos`,        label: 'Planos',       icon: FileText,      permissao: 'planos.ver' },
    { href: `${base}/matriculas`,    label: 'Matrículas',   icon: ClipboardList, permissao: 'matriculas.ver' },
    { href: `${base}/mensalidades`,  label: 'Mensalidades', icon: CreditCard,    permissao: 'mensalidades.ver' },
    { href: `${base}/financeiro`,    label: 'Financeiro',   icon: DollarSign,    permissao: 'financeiro.ver' },
    { href: `${base}/presencas`,     label: 'Presenças',    icon: CheckSquare,   permissao: 'presencas.ver' },
    { href: `${base}/relatorios`,    label: 'Relatórios',   icon: BarChart2,     permissao: 'relatorios.ver' },
    { href: `${base}/configuracoes`, label: 'Configurações',icon: Settings,      permissao: 'configuracoes.gerenciar' },
    { href: `${base}/sobre`,         label: 'Sobre',        icon: Info },
  ]
}

interface SidebarProps {
  slug: string
  papel: PapelAcademia
}

export function Sidebar({ slug, papel }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const items = getNavItems(slug).filter(
    item => !item.permissao || podeAcessar(papel, item.permissao)
  )

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-sidebar transition-all duration-200 relative',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed && 'justify-center px-2')}>
        {collapsed
          ? <LogoIcone tamanho={32} />
          : <Logo variante="branca" largura={160} prioridade />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2 scrollbar-thin">
        {items.map(item => {
          const active = pathname.startsWith(item.href)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center justify-center p-3 text-slate-400 hover:text-white border-t border-white/10 transition-colors"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* OneMoreCode */}
      {!collapsed && (
        <div className="px-4 pb-4 text-xs text-slate-600 text-center">
          Uma solução OneMoreCode
        </div>
      )}
    </aside>
  )
}
