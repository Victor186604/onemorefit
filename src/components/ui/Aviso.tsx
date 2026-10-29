import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tipo = 'sucesso' | 'erro' | 'info'

const estilos: Record<Tipo, { cls: string; Icone: typeof Info }> = {
  sucesso: { cls: 'bg-green-50 border-green-200 text-green-800', Icone: CheckCircle2 },
  erro:    { cls: 'bg-red-50 border-red-200 text-red-800',       Icone: AlertCircle },
  info:    { cls: 'bg-gray-50 border-gray-200 text-gray-700',    Icone: Info },
}

export function Aviso({ tipo = 'info', children, className }: { tipo?: Tipo; children: React.ReactNode; className?: string }) {
  const { cls, Icone } = estilos[tipo]
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cn('flex gap-2 items-start border rounded-lg px-3 py-2 text-sm', cls, className)}>
      <Icone size={16} className="mt-0.5 flex-shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
