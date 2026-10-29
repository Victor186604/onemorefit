import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({ itens }: { itens: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        {itens.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} aria-hidden />}
            {item.href
              ? <Link href={item.href} className="hover:text-brand-700 hover:underline">{item.label}</Link>
              : <span aria-current="page" className="text-gray-800 font-medium">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
