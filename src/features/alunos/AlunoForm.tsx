'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { salvarAluno } from './actions'
import { cpfValido } from '@/lib/utils'
import { useState } from 'react'

const schema = z.object({
  nome:          z.string().min(2, 'Nome obrigatório'),
  email:         z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone:      z.string().optional(),
  cpf:           z.string().optional().refine(v => !v || cpfValido(v), 'CPF inválido'),
  dataNascimento:z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero:     z.string().optional(),
  enderecoBairro:     z.string().optional(),
  enderecoCidade:     z.string().optional(),
  enderecoEstado:     z.string().optional(),
  contatoEmerg:  z.string().optional(),
  telefoneEmerg: z.string().optional(),
  observacoes:   z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  slug: string
  academiaId: string
  inicial?: Partial<FormData> & { id?: string }
}

export function AlunoForm({ slug, academiaId, inicial }: Props) {
  const router  = useRouter()
  const [erro, setErro] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: inicial ?? {},
  })

  async function onSubmit(data: FormData) {
    setErro('')
    const res = await salvarAluno({ ...data, academiaId, id: inicial?.id })
    if (res.erro) { setErro(res.erro); return }
    router.push(`/a/${slug}/alunos/${res.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dados pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome completo *" erro={errors.nome?.message}>
            <input {...register('nome')} className={inputCls} placeholder="Nome do aluno" />
          </Campo>
          <Campo label="CPF" erro={errors.cpf?.message}>
            <input {...register('cpf')} className={inputCls} placeholder="000.000.000-00" />
          </Campo>
          <Campo label="Data de nascimento">
            <input type="date" {...register('dataNascimento')} className={inputCls} />
          </Campo>
          <Campo label="Telefone">
            <input {...register('telefone')} className={inputCls} placeholder="(11) 99999-9999" />
          </Campo>
          <Campo label="E-mail" erro={errors.email?.message} className="sm:col-span-2">
            <input type="email" {...register('email')} className={inputCls} placeholder="email@exemplo.com" />
          </Campo>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Endereço <span className="text-gray-400 font-normal text-sm">(opcional)</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Logradouro" className="sm:col-span-2">
            <input {...register('enderecoLogradouro')} className={inputCls} placeholder="Rua, Avenida..." />
          </Campo>
          <Campo label="Número">
            <input {...register('enderecoNumero')} className={inputCls} />
          </Campo>
          <Campo label="Bairro">
            <input {...register('enderecoBairro')} className={inputCls} />
          </Campo>
          <Campo label="Cidade">
            <input {...register('enderecoCidade')} className={inputCls} />
          </Campo>
          <Campo label="UF">
            <input {...register('enderecoEstado')} className={inputCls} maxLength={2} />
          </Campo>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Contato de emergência <span className="text-gray-400 font-normal text-sm">(opcional)</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome">
            <input {...register('contatoEmerg')} className={inputCls} />
          </Campo>
          <Campo label="Telefone">
            <input {...register('telefoneEmerg')} className={inputCls} />
          </Campo>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Campo label="Observações internas">
          <textarea {...register('observacoes')} rows={3} className={inputCls} />
        </Campo>
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {inicial?.id ? 'Salvar alterações' : 'Cadastrar aluno'}
        </button>
      </div>
    </form>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

function Campo({ label, erro, children, className = '' }: {
  label: string; erro?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  )
}
