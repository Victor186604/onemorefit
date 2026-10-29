'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ASSINATURA } from '@/lib/labels'
import { Campo, inputCls } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

interface Dados { assinatura: string; assinaturaAte: string }

export function AssinaturaForm({ inicial, acao }: {
  inicial: Dados
  acao: (d: Dados) => Promise<{ erro?: string }>
}) {
  const router = useRouter()
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const { register, handleSubmit, formState: { isSubmitting, isDirty }, reset } = useForm<Dados>({ defaultValues: inicial })

  async function enviar(d: Dados) {
    setMsg(null)
    const r = await acao(d)
    if (r.erro) { setMsg({ tipo: 'erro', texto: r.erro }); return }
    setMsg({ tipo: 'sucesso', texto: 'Assinatura atualizada.' })
    reset(d); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Campo label="Situação" htmlFor="a-sit">
          <select id="a-sit" className={inputCls} {...register('assinatura')}>
            {Object.entries(ASSINATURA).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </Campo>
        <Campo label="Válida até" htmlFor="a-ate" ajuda="Opcional">
          <input id="a-ate" type="date" className={inputCls} {...register('assinaturaAte')} />
        </Campo>
      </div>
      <p className="text-xs text-gray-500">
        Controle manual: mudar a situação da assinatura não bloqueia o acesso sozinho. Para bloquear, use “Suspender acesso”.
      </p>
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      <Botao type="submit" carregando={isSubmitting} disabled={!isDirty}>Salvar assinatura</Botao>
    </form>
  )
}
