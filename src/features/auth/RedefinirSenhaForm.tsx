'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { solicitarResetSenha, confirmarResetSenha } from '@/features/auth/actions'

const solicitarSchema = z.object({ email: z.string().email() })
const confirmarSchema = z.object({
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmar: z.string(),
}).refine(d => d.senha === d.confirmar, { message: 'Senhas não coincidem', path: ['confirmar'] })

export function RedefinirSenhaForm({ token }: { token?: string }) {
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState('')

  if (token) {
    return <ConfirmarForm token={token} setOk={setOk} setErro={setErro} ok={ok} erro={erro} />
  }
  return <SolicitarForm setOk={setOk} setErro={setErro} ok={ok} erro={erro} />
}

function SolicitarForm({ setOk, setErro, ok, erro }: any) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(solicitarSchema),
  })

  async function onSubmit(data: any) {
    setErro('')
    const res = await solicitarResetSenha(data.email)
    if (res.erro) setErro(res.erro)
    else setOk(true)
  }

  if (ok) return (
    <div className="text-center">
      <p className="text-green-700 font-medium">Verifique seu e-mail.</p>
      <p className="text-sm text-gray-500 mt-2">Se o e-mail existir, enviaremos o link de redefinição.</p>
      <a href="/login" className="block mt-4 text-brand-600 text-sm hover:underline">Voltar ao login</a>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Esqueci minha senha</h2>
      <p className="text-sm text-gray-500">Informe seu e-mail para receber o link de redefinição.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input type="email" {...register('email')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full bg-brand-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />} Enviar link
      </button>
      <a href="/login" className="block text-center text-sm text-brand-600 hover:underline">Voltar ao login</a>
    </form>
  )
}

function ConfirmarForm({ token, setOk, setErro, ok, erro }: any) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(confirmarSchema),
  })

  async function onSubmit(data: any) {
    setErro('')
    const res = await confirmarResetSenha(token, data.senha)
    if (res.erro) setErro(res.erro)
    else setOk(true)
  }

  if (ok) return (
    <div className="text-center">
      <p className="text-green-700 font-medium">Senha redefinida com sucesso!</p>
      <a href="/login" className="block mt-4 text-brand-600 text-sm hover:underline">Ir para o login</a>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Nova senha</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
        <input type="password" {...register('senha')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        {errors.senha && <p className="text-red-500 text-xs mt-1">{(errors.senha as any).message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
        <input type="password" {...register('confirmar')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        {errors.confirmar && <p className="text-red-500 text-xs mt-1">{(errors.confirmar as any).message}</p>}
      </div>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full bg-brand-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />} Redefinir senha
      </button>
    </form>
  )
}
