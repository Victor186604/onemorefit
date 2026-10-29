import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variante = 'primario' | 'secundario' | 'perigo'

const base =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variantes: Record<Variante, string> = {
  primario:   'bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500',
  secundario: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-brand-500',
  perigo:     'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
}

/** Para usar o mesmo visual em <Link>. */
export function botaoCls(variante: Variante = 'primario', className?: string) {
  return cn(base, variantes[variante], className)
}

interface BotaoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  carregando?: boolean
}

export function Botao({ variante = 'primario', carregando, className, children, disabled, ...rest }: BotaoProps) {
  return (
    <button {...rest} disabled={disabled || carregando} className={botaoCls(variante, className)}>
      {carregando && <Loader2 size={14} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
