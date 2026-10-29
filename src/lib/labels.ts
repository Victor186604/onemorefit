import type { PapelAcademia, AcademiaSituacao, AssinaturaSituacao } from '@prisma/client'

export const PAPEL_LABEL: Record<PapelAcademia, string> = {
  ADMIN: 'Administrador',
  RECEPCAO: 'Recepção',
  FINANCEIRO: 'Financeiro',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
}

export const SITUACAO_ACADEMIA: Record<AcademiaSituacao, { label: string; cls: string }> = {
  ATIVA:     { label: 'Ativa',     cls: 'bg-green-100 text-green-700' },
  SUSPENSA:  { label: 'Suspensa',  cls: 'bg-red-100 text-red-700' },
  ENCERRADA: { label: 'Encerrada', cls: 'bg-gray-100 text-gray-600' },
}

export const ASSINATURA: Record<AssinaturaSituacao, { label: string; cls: string }> = {
  TRIAL:        { label: 'Período de teste', cls: 'bg-amber-100 text-amber-800' },
  ATIVA:        { label: 'Ativa',            cls: 'bg-green-100 text-green-700' },
  INADIMPLENTE: { label: 'Inadimplente',     cls: 'bg-red-100 text-red-700' },
  CANCELADA:    { label: 'Cancelada',        cls: 'bg-gray-100 text-gray-600' },
}
