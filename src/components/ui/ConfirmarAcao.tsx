'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Botao, botaoCls } from './Botao'
import { Aviso } from './Aviso'
import { inputCls } from './Campo'

interface Props {
  textoBotao: string
  titulo: string
  descricao: React.ReactNode
  textoConfirmar?: string
  variante?: 'primario' | 'secundario' | 'perigo'
  /** Se informado, exige um motivo (mín. 5 caracteres) antes de confirmar. */
  pedirMotivo?: string
  acao: (motivo: string) => Promise<{ erro?: string }>
  tamanho?: 'normal' | 'pequeno'
}

/** Botão que abre uma confirmação antes de executar uma ação relevante. */
export function ConfirmarAcao({
  textoBotao, titulo, descricao, textoConfirmar = 'Confirmar',
  variante = 'primario', pedirMotivo, acao, tamanho = 'normal',
}: Props) {
  const router = useRouter()
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, iniciar] = useTransition()
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return
    cancelarRef.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pendente) setAberto(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, pendente])

  const motivoOk = !pedirMotivo || motivo.trim().length >= 5

  function confirmar() {
    setErro('')
    iniciar(async () => {
      const res = await acao(motivo.trim())
      if (res.erro) { setErro(res.erro); return }
      setAberto(false); setMotivo('')
      router.refresh()
    })
  }

  return (
    <>
      <Botao
        type="button"
        variante={variante === 'perigo' ? 'secundario' : variante}
        className={tamanho === 'pequeno' ? 'px-3 py-1 text-xs' : undefined}
        onClick={() => { setErro(''); setAberto(true) }}
      >
        {textoBotao}
      </Botao>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !pendente && setAberto(false)}>
          <div
            role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}
            className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 id={`${id}-t`} className="text-lg font-semibold text-gray-900">{titulo}</h2>
            <div className="text-sm text-gray-600">{descricao}</div>

            {pedirMotivo && (
              <div>
                <label htmlFor={`${id}-m`} className="block text-sm font-medium text-gray-700 mb-1">{pedirMotivo}</label>
                <textarea id={`${id}-m`} rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} className={inputCls} maxLength={500} />
              </div>
            )}

            {erro && <Aviso tipo="erro">{erro}</Aviso>}

            <div className="flex justify-end gap-2">
              <button ref={cancelarRef} type="button" className={botaoCls('secundario')} onClick={() => setAberto(false)} disabled={pendente}>
                Cancelar
              </button>
              <Botao type="button" variante={variante} onClick={confirmar} carregando={pendente} disabled={!motivoOk}>
                {textoConfirmar}
              </Botao>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
