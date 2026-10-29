
export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'

interface CampoProps {
  label: string
  htmlFor: string
  erro?: string
  ajuda?: string
  className?: string
  children: React.ReactNode
}

/** Rótulo + campo + mensagem de erro/ajuda, ligados por id para leitores de tela. */
export function Campo({ label, htmlFor, erro, ajuda, className, children }: CampoProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {ajuda && !erro && <p id={`${htmlFor}-ajuda`} className="text-xs text-gray-500 mt-1">{ajuda}</p>}
      {erro && <p id={`${htmlFor}-erro`} role="alert" className="text-xs text-red-600 mt-1">{erro}</p>}
    </div>
  )
}
