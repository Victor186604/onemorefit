'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { salvarConfigAcademia } from './actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const schema = z.object({
  nome:      z.string().min(2, 'Nome obrigatório'),
  email:     z.string().email().optional().or(z.literal('')),
  telefone:  z.string().optional(),
  cnpj:      z.string().optional(),
  endereco:  z.string().optional(),
  cidade:    z.string().optional(),
  estado:    z.string().optional(),
  cep:       z.string().optional(),
  fuso:      z.string(),
  logoUrl:   z.string().url('URL inválida').optional().or(z.literal('')),
  reciboHeader: z.string().optional(),
  reciboFooter: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ConfigAcademiaForm({ academia, slug }: { academia: any; slug: string }) {
  const router = useRouter()
  const [ok, setOk]   = useState(false)
  const [erro, setErro] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome:     academia.nome,
      email:    academia.email ?? '',
      telefone: academia.telefone ?? '',
      cnpj:     academia.cnpj ?? '',
      endereco: academia.endereco ?? '',
      cidade:   academia.cidade ?? '',
      estado:   academia.estado ?? '',
      cep:      academia.cep ?? '',
      fuso:     academia.fuso ?? 'America/Sao_Paulo',
      logoUrl:  academia.logoUrl ?? '',
      reciboHeader: academia.configuracoes?.reciboHeader ?? '',
      reciboFooter: academia.configuracoes?.reciboFooter ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setErro(''); setOk(false)
    const res = await salvarConfigAcademia({ ...data, academiaId: academia.id })
    if (res.erro) { setErro(res.erro); return }
    setOk(true)
    router.refresh()
  }

  const cls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dados da academia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome *" erro={errors.nome?.message} className="sm:col-span-2">
            <input {...register('nome')} className={cls} />
          </Campo>
          <Campo label="E-mail">
            <input type="email" {...register('email')} className={cls} />
          </Campo>
          <Campo label="Telefone">
            <input {...register('telefone')} className={cls} />
          </Campo>
          <Campo label="CNPJ">
            <input {...register('cnpj')} className={cls} placeholder="00.000.000/0000-00" />
          </Campo>
          <Campo label="CEP">
            <input {...register('cep')} className={cls} />
          </Campo>
          <Campo label="Endereço" className="sm:col-span-2">
            <input {...register('endereco')} className={cls} />
          </Campo>
          <Campo label="Cidade">
            <input {...register('cidade')} className={cls} />
          </Campo>
          <Campo label="UF">
            <input {...register('estado')} className={cls} maxLength={2} />
          </Campo>
          <Campo label="Fuso horário" className="sm:col-span-2">
            <select {...register('fuso')} className={cls}>
              <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
              <option value="America/Manaus">Manaus (America/Manaus)</option>
              <option value="America/Belem">Belém (America/Belem)</option>
              <option value="America/Fortaleza">Fortaleza (America/Fortaleza)</option>
            </select>
          </Campo>
          <Campo label="URL do logotipo (HTTPS)" erro={errors.logoUrl?.message} className="sm:col-span-2">
            <input {...register('logoUrl')} className={cls} placeholder="https://..." />
            <p className="text-xs text-gray-400 mt-1">Use uma URL pública HTTPS. Não são aceitas URLs locais.</p>
          </Campo>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Configurações de recibo</h2>
        <Campo label="Cabeçalho do recibo">
          <textarea {...register('reciboHeader')} rows={2} className={cls} placeholder="Texto exibido no topo dos recibos" />
        </Campo>
        <Campo label="Rodapé do recibo">
          <textarea {...register('reciboFooter')} rows={2} className={cls} placeholder="Texto exibido no rodapé dos recibos" />
        </Campo>
      </div>

      <div className="text-xs text-gray-400 px-1">
        A assinatura "Uma solução OneMoreCode" é mantida nos recibos conforme contrato.
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      {ok  && <p className="text-green-600 text-sm">Configurações salvas!</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Salvar configurações
        </button>
      </div>
    </form>
  )
}

function Campo({ label, erro, children, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  )
}
