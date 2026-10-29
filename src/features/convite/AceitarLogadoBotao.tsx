'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aceitarConviteLogado } from './actions'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

export function AceitarLogadoBotao({ token }: { token: string }) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [pendente, iniciar] = useTransition()

  function aceitar() {
    setErro('')
    iniciar(async () => {
      const r = await aceitarConviteLogado(token)
      if (r.erro || !r.slug) { setErro(r.erro ?? 'Não foi possível concluir.'); return }
      router.push(`/a/${r.slug}/dashboard`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <Botao type="button" onClick={aceitar} carregando={pendente} className="w-full">Aceitar convite</Botao>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </div>
  )
}
