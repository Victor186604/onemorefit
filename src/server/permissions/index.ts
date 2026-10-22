import type { PapelAcademia } from '@prisma/client'

type Permissao =
  | 'alunos.ver' | 'alunos.criar' | 'alunos.editar' | 'alunos.inativar'
  | 'planos.ver' | 'planos.gerenciar'
  | 'matriculas.ver' | 'matriculas.criar' | 'matriculas.cancelar'
  | 'mensalidades.ver' | 'mensalidades.receber' | 'mensalidades.estornar'
  | 'financeiro.ver' | 'financeiro.gerenciar'
  | 'presencas.ver' | 'presencas.registrar' | 'presencas.anular'
  | 'relatorios.ver'
  | 'configuracoes.gerenciar'
  | 'usuarios.gerenciar'
  | 'auditoria.ver'

const PERMISSOES: Record<PapelAcademia, Permissao[]> = {
  ADMIN: [
    'alunos.ver', 'alunos.criar', 'alunos.editar', 'alunos.inativar',
    'planos.ver', 'planos.gerenciar',
    'matriculas.ver', 'matriculas.criar', 'matriculas.cancelar',
    'mensalidades.ver', 'mensalidades.receber', 'mensalidades.estornar',
    'financeiro.ver', 'financeiro.gerenciar',
    'presencas.ver', 'presencas.registrar', 'presencas.anular',
    'relatorios.ver',
    'configuracoes.gerenciar',
    'usuarios.gerenciar',
    'auditoria.ver',
  ],
  RECEPCAO: [
    'alunos.ver', 'alunos.criar', 'alunos.editar',
    'matriculas.ver',
    'mensalidades.ver',
    'presencas.ver', 'presencas.registrar',
  ],
  FINANCEIRO: [
    'alunos.ver',
    'matriculas.ver',
    'mensalidades.ver', 'mensalidades.receber', 'mensalidades.estornar',
    'financeiro.ver', 'financeiro.gerenciar',
    'relatorios.ver',
  ],
  PROFESSOR: [
    'alunos.ver',
    'presencas.ver', 'presencas.registrar',
  ],
  ALUNO: [],
}

export function podeAcessar(papel: PapelAcademia, permissao: Permissao): boolean {
  return PERMISSOES[papel]?.includes(permissao) ?? false
}

export function assertPermissao(papel: PapelAcademia, permissao: Permissao): void {
  if (!podeAcessar(papel, permissao)) {
    throw new Error(`Sem permissão: ${permissao}`)
  }
}

export type { Permissao }
