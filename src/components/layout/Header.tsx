'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Building2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  academiaNome: string
  userNome: string
  slug: string
}

export function Header({ academiaNome, userNome, slug }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const iniciais = userNome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Building2 size={16} className="text-gray-400" />
        <span className="font-medium text-gray-900">{academiaNome}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {iniciais}
          </div>
          <span className="hidden sm:block max-w-32 truncate">{userNome}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <Link
              href="/selecionar-academia"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Building2 size={14} />
              Trocar academia
            </Link>
            <hr className="my-1" />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
