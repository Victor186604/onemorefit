'use server'

import { db } from '@/server/db/client'
import { getSessionUser } from '@/server/auth/session'
import { audit } from '@/server/services/audit'
import { z } from 'zod'
import { cpfValido } from '@/lib/utils'

const alunoSchema = z.object({
  id:            z.string().optional(),
  academiaId:    z.string(),
  nome:          z.string().min(2),
  email:         z.string().email().optional().or(z.literal('')),
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

export async function salvarAluno(input: unknown): Promise<{ id?: string; erro?: string }> {
  const parsed = alunoSchema.safeParse(input)
  if (!parsed.success) return { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' }

  const user   = await getSessionUser()
  const prisma = await db()
  const d      = parsed.data

  // Verificar vínculo com a academia
  const vinculo = await prisma.userAcademia.findUnique({
    where: { userId_academiaId: { userId: user.id, academiaId: d.academiaId } },
  })
  if (!vinculo || !vinculo.ativo) return { erro: 'Sem permissão' }
  if (!['ADMIN', 'RECEPCAO'].includes(vinculo.papel)) return { erro: 'Sem permissão' }

  // Verificar CPF duplicado na academia
  if (d.cpf) {
    const dup = await prisma.aluno.findUnique({
      where: { academiaId_cpf: { academiaId: d.academiaId, cpf: d.cpf } },
    })
    if (dup && dup.id !== d.id) return { erro: 'CPF já cadastrado nesta academia' }
  }

  const dados = {
    nome:           d.nome,
    email:          d.email || null,
    telefone:       d.telefone || null,
    cpf:            d.cpf || null,
    dataNascimento: d.dataNascimento ? new Date(d.dataNascimento) : null,
    enderecoLogradouro: d.enderecoLogradouro || null,
    enderecoNumero:     d.enderecoNumero || null,
    enderecoBairro:     d.enderecoBairro || null,
    enderecoCidade:     d.enderecoCidade || null,
    enderecoEstado:     d.enderecoEstado || null,
    contatoEmerg:   d.contatoEmerg || null,
    telefoneEmerg:  d.telefoneEmerg || null,
    observacoes:    d.observacoes || null,
  }

  if (d.id) {
    await prisma.aluno.update({ where: { id: d.id }, data: dados })
    await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
      acao: 'EDITAR', entidade: 'Aluno', entidadeId: d.id, descricao: `Editou aluno ${d.nome}` })
    return { id: d.id }
  } else {
    const aluno = await prisma.aluno.create({ data: { ...dados, academiaId: d.academiaId } })
    await audit({ prisma, academiaId: d.academiaId, userId: user.id, nomeUser: user.nome,
      acao: 'CRIAR', entidade: 'Aluno', entidadeId: aluno.id, descricao: `Cadastrou aluno ${d.nome}` })
    return { id: aluno.id }
  }
}
