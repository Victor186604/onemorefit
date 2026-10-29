'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Campo, inputCls } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

interface Dados { nome: string; cidade: string; estado: string; observacoes: string }

export function DadosAcademiaForm({ inicial, acao }: {
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
    setMsg({ tipo: 'sucesso', texto: 'Dados salvos.' })
    reset(d); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <Campo label="Nome" htmlFor="d-nome"><input id="d-nome" className={inputCls} {...register('nome', { required: true })} /></Campo>
      <div className="grid grid-cols-3 gap-4">
        <Campo label="Cidade" htmlFor="d-cidade" className="col-span-2"><input id="d-cidade" className={inputCls} {...register('cidade')} /></Campo>
        <Campo label="UF" htmlFor="d-estado"><input id="d-estado" maxLength={2} className={inputCls} {...register('estado')} /></Campo>
      </div>
      <Campo label="Observações internas" htmlFor="d-obs" ajuda="Visível só para a OneMoreCode">
        <textarea id="d-obs" rows={2} className={inputCls} {...register('observacoes')} />
      </Campo>
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      <Botao type="submit" carregando={isSubmitting} disabled={!isDirty}>Salvar dados</Botao>
    </form>
  )
}
