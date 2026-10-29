'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { criarAcademia } from './actions'
import { gerarSlug, SLUG_REGEX } from '@/lib/slug'
import { ASSINATURA } from '@/lib/labels'
import { Campo, inputCls } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

const schema = z.object({
  nome:          z.string().trim().min(2, 'Informe o nome'),
  slug:          z.string().trim().min(3, 'Mínimo 3 caracteres').max(40).regex(SLUG_REGEX, 'Use só letras minúsculas, números e hífen'),
  cidade:        z.string().optional(),
  estado:        z.string().max(2).optional(),
  assinatura:    z.enum(['TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA']),
  assinaturaAte: z.string().optional(),
  observacoes:   z.string().optional(),
  emailAdmin:    z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
})
type Dados = z.infer<typeof schema>

export function NovaAcademiaForm() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { assinatura: 'TRIAL', slug: '' },
  })
  const slug = watch('slug')

  async function enviar(d: Dados) {
    setErro('')
    const r = await criarAcademia(d)
    if (r.erro) { setErro(r.erro); return }
    const qs = new URLSearchParams({ criada: '1' })
    if (r.avisoConvite) qs.set('avisoConvite', r.avisoConvite)
    else if (d.emailAdmin) qs.set('convite', '1')
    router.push(`/plataforma/academias/${r.id}?${qs}`)
  }

  const nomeReg = register('nome')

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-6" noValidate>
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Academia</h2>
        <Campo label="Nome *" htmlFor="nome" erro={errors.nome?.message}>
          <input
            id="nome" className={inputCls} autoFocus
            {...nomeReg}
            onChange={e => { nomeReg.onChange(e); if (!slugEditado) setValue('slug', gerarSlug(e.target.value)) }}
          />
        </Campo>
        <Campo
          label="Endereço do painel *" htmlFor="slug" erro={errors.slug?.message}
          ajuda={`A equipe da academia vai acessar em /a/${slug || 'endereco'}. Não pode ser alterado depois.`}
        >
          <input id="slug" className={inputCls} {...register('slug', { onChange: () => setSlugEditado(true) })} />
        </Campo>
        <div className="grid grid-cols-3 gap-4">
          <Campo label="Cidade" htmlFor="cidade" className="col-span-2">
            <input id="cidade" className={inputCls} {...register('cidade')} />
          </Campo>
          <Campo label="UF" htmlFor="estado" erro={errors.estado?.message}>
            <input id="estado" className={inputCls} maxLength={2} {...register('estado')} />
          </Campo>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Assinatura do OneMoreFit</h2>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Situação" htmlFor="assinatura">
            <select id="assinatura" className={inputCls} {...register('assinatura')}>
              {Object.entries(ASSINATURA).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </Campo>
          <Campo label="Válida até" htmlFor="assinaturaAte" ajuda="Opcional">
            <input id="assinaturaAte" type="date" className={inputCls} {...register('assinaturaAte')} />
          </Campo>
        </div>
        <Campo label="Observações internas" htmlFor="observacoes" ajuda="Visível só para a OneMoreCode">
          <textarea id="observacoes" rows={2} className={inputCls} {...register('observacoes')} />
        </Campo>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Administrador da academia</h2>
        <Campo
          label="E-mail do administrador" htmlFor="emailAdmin" erro={errors.emailAdmin?.message}
          ajuda="Opcional. Se informado, já enviamos o convite de acesso. Você também pode convidar depois."
        >
          <input id="emailAdmin" type="email" className={inputCls} {...register('emailAdmin')} />
        </Campo>
      </section>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <div className="flex gap-3">
        <Botao type="button" variante="secundario" onClick={() => router.back()}>Cancelar</Botao>
        <Botao type="submit" carregando={isSubmitting}>Criar academia</Botao>
      </div>
    </form>
  )
}
