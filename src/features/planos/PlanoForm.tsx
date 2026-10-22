'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { salvarPlano } from './actions'
import { useState } from 'react'

const schema = z.object({
  nome:          z.string().min(2, 'Nome obrigatório'),
  descricao:     z.string().optional(),
  modalidade:    z.string().optional(),
  tipoDuracao:   z.enum(['MENSAL_RECORRENTE', 'CONTRATO_PRAZO']),
  duracaoMeses:  z.coerce.number().int().positive().optional().nullable(),
  valor:         z.coerce.number({ invalid_type_error: 'Valor inválido' }).positive('Valor obrigatório'),
  taxaMatricula: z.coerce.number().nonnegative().optional().nullable(),
  disponivelNovo:z.boolean().default(true),
  ativo:         z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  slug: string
  academiaId: string
  inicial?: Partial<FormData> & { id?: string }
}

export function PlanoForm({ slug, academiaId, inicial }: Props) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipoDuracao: 'MENSAL_RECORRENTE', disponivelNovo: true, ativo: true, ...inicial },
  })

  const tipo = watch('tipoDuracao')

  async function onSubmit(data: FormData) {
    setErro('')
    const res = await salvarPlano({ ...data, academiaId, id: inicial?.id })
    if (res.erro) { setErro(res.erro); return }
    router.push(`/a/${slug}/planos`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Campo label="Nome *" erro={errors.nome?.message}>
        <input {...register('nome')} className={cls} placeholder="Ex: Mensal, Trimestral..." />
      </Campo>
      <Campo label="Descrição">
        <textarea {...register('descricao')} rows={2} className={cls} />
      </Campo>
      <Campo label="Modalidade">
        <input {...register('modalidade')} className={cls} placeholder="Ex: Musculação, Pilates..." />
      </Campo>
      <Campo label="Tipo *" erro={errors.tipoDuracao?.message}>
        <select {...register('tipoDuracao')} className={cls}>
          <option value="MENSAL_RECORRENTE">Mensal recorrente</option>
          <option value="CONTRATO_PRAZO">Contrato com prazo</option>
        </select>
      </Campo>
      {tipo === 'CONTRATO_PRAZO' && (
        <Campo label="Duração (meses) *" erro={errors.duracaoMeses?.message}>
          <input type="number" min={1} {...register('duracaoMeses')} className={cls} />
        </Campo>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Campo label="Valor mensal (R$) *" erro={errors.valor?.message}>
          <input type="number" step="0.01" min="0" {...register('valor')} className={cls} placeholder="0,00" />
        </Campo>
        <Campo label="Taxa de matrícula (R$)">
          <input type="number" step="0.01" min="0" {...register('taxaMatricula')} className={cls} placeholder="0,00" />
        </Campo>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('disponivelNovo')} className="rounded" />
          Disponível para novas matrículas
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('ativo')} className="rounded" />
          Ativo
        </label>
      </div>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {inicial?.id ? 'Salvar' : 'Criar plano'}
        </button>
      </div>
    </form>
  )
}

const cls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

function Campo({ label, erro, children, className = '' }: { label: string; erro?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  )
}
