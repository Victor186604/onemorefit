'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { aceitarConviteNovaConta } from './actions'
import { Campo, inputCls } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { Aviso } from '@/components/ui/Aviso'

const schema = z.object({
  nome:      z.string().trim().min(2, 'Informe seu nome'),
  senha:     z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Senha longa demais'),
  confirmar: z.string(),
}).refine(d => d.senha === d.confirmar, { message: 'As senhas não coincidem', path: ['confirmar'] })
type Dados = z.infer<typeof schema>

export function NovaContaForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Dados>({ resolver: zodResolver(schema) })

  async function enviar(d: Dados) {
    setErro('')
    const r = await aceitarConviteNovaConta({ token, nome: d.nome, senha: d.senha })
    if (r.erro || !r.slug) { setErro(r.erro ?? 'Não foi possível concluir.'); return }

    // Conta criada: entra automaticamente
    const login = await signIn('credentials', { email: r.email ?? email, senha: d.senha, redirect: false })
    if (login?.error) { router.push('/login'); return }
    router.push(`/a/${r.slug}/dashboard`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
      <Campo label="E-mail" htmlFor="c-email" ajuda="O acesso é vinculado ao e-mail que recebeu o convite.">
        <input id="c-email" value={email} disabled className={inputCls} />
      </Campo>
      <Campo label="Seu nome" htmlFor="c-nome" erro={errors.nome?.message}>
        <input id="c-nome" autoComplete="name" autoFocus className={inputCls} {...register('nome')} />
      </Campo>
      <Campo label="Crie uma senha" htmlFor="c-senha" erro={errors.senha?.message} ajuda="Mínimo 8 caracteres.">
        <input id="c-senha" type="password" autoComplete="new-password" className={inputCls} {...register('senha')} />
      </Campo>
      <Campo label="Confirme a senha" htmlFor="c-confirmar" erro={errors.confirmar?.message}>
        <input id="c-confirmar" type="password" autoComplete="new-password" className={inputCls} {...register('confirmar')} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao type="submit" carregando={isSubmitting} className="w-full">Criar conta e acessar</Botao>
    </form>
  )
}
