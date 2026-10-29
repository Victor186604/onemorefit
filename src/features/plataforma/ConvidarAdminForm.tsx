'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Campo, inputCls } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

export function ConvidarAdminForm({ acao }: { acao: (email: string) => Promise<{ erro?: string }> }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null); setEnviando(true)
    const r = await acao(email)
    setEnviando(false)
    if (r.erro) { setMsg({ tipo: 'erro', texto: r.erro }); return }
    setMsg({ tipo: 'sucesso', texto: `Convite enviado para ${email}. Ele vale por 48 horas.` })
    setEmail(''); router.refresh()
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="flex gap-2 items-end">
        <Campo label="Convidar administrador" htmlFor="conv-email" className="flex-1">
          <input id="conv-email" type="email" required placeholder="email@academia.com.br"
            value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
        </Campo>
        <Botao type="submit" carregando={enviando}>Enviar convite</Botao>
      </div>
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
    </form>
  )
}
