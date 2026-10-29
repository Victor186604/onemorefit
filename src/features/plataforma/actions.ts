'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db/client'
import { platformAdminOuNull } from '@/server/auth/guards'
import { audit } from '@/server/services/audit'
import { criarAcademiaComPadroes } from '@/server/services/academias'
import { criarEnviarConvite } from '@/server/services/convites'
import { SLUG_REGEX } from '@/lib/slug'

type Resultado = { erro?: string }
const SEM_PERMISSAO = { erro: 'Sem permissão' }

const dataOpcional = z
  .string().trim()
  .refine(v => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Data inválida')
  .optional()

/** "2026-11-30" → meio-dia UTC, para não mudar de dia em nenhum fuso do Brasil. */
function paraData(v?: string): Date | null {
  return v ? new Date(`${v}T12:00:00Z`) : null
}

const ASSINATURAS = ['TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA'] as const

// ─── Criar academia ────────────────────────────────────────

const novaAcademiaSchema = z.object({
  nome:          z.string().trim().min(2, 'Informe o nome').max(120),
  slug:          z.string().trim().min(3, 'Mínimo 3 caracteres').max(40)
                   .regex(SLUG_REGEX, 'Use só letras minúsculas, números e hífen'),
  cidade:        z.string().trim().max(80).optional(),
  estado:        z.string().trim().max(2).optional(),
  assinatura:    z.enum(ASSINATURAS),
  assinaturaAte: dataOpcional,
  observacoes:   z.string().trim().max(1000).optional(),
  emailAdmin:    z.string().trim().toLowerCase().email('E-mail inválido').optional().or(z.literal('')),
})

export async function criarAcademia(
  input: unknown,
): Promise<{ id?: string; erro?: string; avisoConvite?: string }> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO

  const parsed = novaAcademiaSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  const d = parsed.data
  const prisma = await db()

  if (await prisma.academia.findUnique({ where: { slug: d.slug }, select: { id: true } })) {
    return { erro: 'Este endereço já está em uso. Escolha outro.' }
  }

  let academia
  try {
    academia = await criarAcademiaComPadroes(prisma, {
      nome: d.nome, slug: d.slug, cidade: d.cidade, estado: d.estado?.toUpperCase(),
      assinatura: d.assinatura, assinaturaAte: paraData(d.assinaturaAte), observacoes: d.observacoes,
    })
  } catch (e: any) {
    if (e?.code === 'P2002') return { erro: 'Este endereço já está em uso. Escolha outro.' }
    throw e
  }

  await audit({
    prisma, academiaId: academia.id, userId: admin.id, nomeUser: admin.nome,
    acao: 'CRIAR', entidade: 'Academia', entidadeId: academia.id,
    descricao: `Academia criada (assinatura: ${d.assinatura})`,
  })

  let avisoConvite: string | undefined
  if (d.emailAdmin) {
    const r = await criarEnviarConvite(prisma, {
      academiaId: academia.id, academiaNome: academia.nome, email: d.emailAdmin, papel: 'ADMIN',
    })
    if (r.erro) avisoConvite = r.erro
    else await audit({
      prisma, academiaId: academia.id, userId: admin.id, nomeUser: admin.nome,
      acao: 'CONVIDAR', entidade: 'Convite', entidadeId: r.conviteId,
      descricao: `Convite de administrador enviado para ${d.emailAdmin}`,
    })
  }

  revalidatePath('/plataforma')
  revalidatePath('/plataforma/academias')
  return { id: academia.id, avisoConvite }
}

// ─── Dados básicos ─────────────────────────────────────────

const dadosSchema = z.object({
  nome:        z.string().trim().min(2, 'Informe o nome').max(120),
  cidade:      z.string().trim().max(80).optional(),
  estado:      z.string().trim().max(2).optional(),
  observacoes: z.string().trim().max(1000).optional(),
})

export async function atualizarDadosAcademia(academiaId: string, input: unknown): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const parsed = dadosSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  const d = parsed.data
  const prisma = await db()

  const existe = await prisma.academia.findUnique({ where: { id: academiaId }, select: { id: true } })
  if (!existe) return { erro: 'Academia não encontrada' }

  await prisma.academia.update({
    where: { id: academiaId },
    data: { nome: d.nome, cidade: d.cidade || null, estado: d.estado?.toUpperCase() || null, observacoes: d.observacoes || null },
  })
  await audit({
    prisma, academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: 'EDITAR', entidade: 'Academia', entidadeId: academiaId, descricao: 'Dados básicos atualizados pela plataforma',
  })
  revalidatePath(`/plataforma/academias/${academiaId}`)
  return {}
}

// ─── Assinatura do OneMoreFit (controle manual) ────────────

const assinaturaSchema = z.object({
  assinatura:    z.enum(ASSINATURAS),
  assinaturaAte: dataOpcional,
})

export async function atualizarAssinatura(academiaId: string, input: unknown): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const parsed = assinaturaSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  const prisma = await db()

  const atual = await prisma.academia.findUnique({ where: { id: academiaId }, select: { assinatura: true } })
  if (!atual) return { erro: 'Academia não encontrada' }

  await prisma.academia.update({
    where: { id: academiaId },
    data:  { assinatura: parsed.data.assinatura, assinaturaAte: paraData(parsed.data.assinaturaAte) },
  })
  await audit({
    prisma, academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: 'ASSINATURA', entidade: 'Academia', entidadeId: academiaId,
    descricao: `Assinatura: ${atual.assinatura} → ${parsed.data.assinatura}` +
      (parsed.data.assinaturaAte ? ` (válida até ${parsed.data.assinaturaAte})` : ''),
  })
  revalidatePath(`/plataforma/academias/${academiaId}`)
  revalidatePath('/plataforma')
  return {}
}

// ─── Suspender / reativar acesso ───────────────────────────

const motivoSchema = z.string().trim().min(5, 'Informe o motivo (mín. 5 caracteres)').max(500)

export async function suspenderAcademia(academiaId: string, motivo: string): Promise<Resultado> {
  return alterarSituacao(academiaId, 'SUSPENSA', motivo)
}

export async function reativarAcademia(academiaId: string, motivo: string): Promise<Resultado> {
  return alterarSituacao(academiaId, 'ATIVA', motivo)
}

async function alterarSituacao(academiaId: string, nova: 'ATIVA' | 'SUSPENSA', motivo: string): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const m = motivoSchema.safeParse(motivo)
  if (!m.success) return { erro: m.error.errors[0]?.message }
  const prisma = await db()

  const atual = await prisma.academia.findUnique({ where: { id: academiaId }, select: { situacao: true } })
  if (!atual) return { erro: 'Academia não encontrada' }
  if (atual.situacao === nova) return { erro: nova === 'ATIVA' ? 'A academia já está ativa' : 'A academia já está suspensa' }

  await prisma.academia.update({ where: { id: academiaId }, data: { situacao: nova } })
  await audit({
    prisma, academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: nova === 'SUSPENSA' ? 'SUSPENDER' : 'REATIVAR', entidade: 'Academia', entidadeId: academiaId,
    descricao: `${nova === 'SUSPENSA' ? 'Acesso suspenso' : 'Acesso reativado'}: ${m.data}`,
  })
  revalidatePath(`/plataforma/academias/${academiaId}`)
  revalidatePath('/plataforma')
  return {}
}

// ─── Convites de administrador ─────────────────────────────

export async function convidarAdmin(academiaId: string, email: string): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const e = z.string().trim().toLowerCase().email('E-mail inválido').safeParse(email)
  if (!e.success) return { erro: e.error.errors[0]?.message }
  const prisma = await db()

  const academia = await prisma.academia.findUnique({ where: { id: academiaId }, select: { id: true, nome: true } })
  if (!academia) return { erro: 'Academia não encontrada' }

  const r = await criarEnviarConvite(prisma, {
    academiaId, academiaNome: academia.nome, email: e.data, papel: 'ADMIN',
  })
  if (r.erro) return { erro: r.erro }

  await audit({
    prisma, academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: 'CONVIDAR', entidade: 'Convite', entidadeId: r.conviteId,
    descricao: `Convite de administrador enviado para ${e.data}`,
  })
  revalidatePath(`/plataforma/academias/${academiaId}`)
  return {}
}

export async function reenviarConvite(conviteId: string): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const prisma = await db()

  const c = await prisma.convite.findUnique({
    where: { id: conviteId }, include: { academia: { select: { nome: true } } },
  })
  if (!c) return { erro: 'Convite não encontrado' }
  if (c.aceitoEm) return { erro: 'Este convite já foi aceito' }

  const r = await criarEnviarConvite(prisma, {
    academiaId: c.academiaId, academiaNome: c.academia.nome, email: c.email, papel: c.papel,
  })
  if (r.erro) return { erro: r.erro }

  await audit({
    prisma, academiaId: c.academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: 'CONVIDAR', entidade: 'Convite', entidadeId: r.conviteId, descricao: `Convite reenviado para ${c.email}`,
  })
  revalidatePath(`/plataforma/academias/${c.academiaId}`)
  return {}
}

export async function cancelarConvite(conviteId: string): Promise<Resultado> {
  const admin = await platformAdminOuNull()
  if (!admin) return SEM_PERMISSAO
  const prisma = await db()

  const c = await prisma.convite.findUnique({ where: { id: conviteId } })
  if (!c) return { erro: 'Convite não encontrado' }
  if (c.aceitoEm) return { erro: 'Este convite já foi aceito' }

  await prisma.convite.update({ where: { id: conviteId }, data: { expiresAt: new Date() } })
  await audit({
    prisma, academiaId: c.academiaId, userId: admin.id, nomeUser: admin.nome,
    acao: 'CANCELAR', entidade: 'Convite', entidadeId: conviteId, descricao: `Convite para ${c.email} cancelado`,
  })
  revalidatePath(`/plataforma/academias/${c.academiaId}`)
  return {}
}
