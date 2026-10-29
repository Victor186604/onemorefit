import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Decimal } from 'decimal.js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return '—'
  const d = typeof data === 'string' ? parseISO(data) : data
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatarDataHora(data: Date | string | null | undefined): string {
  if (!data) return '—'
  const d = typeof data === 'string' ? parseISO(data) : data
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatarMoeda(valor: number | Decimal | string | null | undefined): string {
  if (valor === null || valor === undefined) return 'R$ —'
  const n = typeof valor === 'object' ? Number(valor.toString()) : Number(valor)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export function formatarCompetencia(competencia: string): string {
  // "2024-03" → "mar/2024"
  const [ano, mes] = competencia.split('-')
  const d = new Date(Number(ano), Number(mes) - 1, 1)
  return format(d, 'MMM/yyyy', { locale: ptBR })
}

export function cpfValido(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += Number(c[i]) * (10 - i)
  let r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== Number(c[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += Number(c[i]) * (11 - i)
  r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === Number(c[10])
}

export function truncar(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

/** Arredondamento monetário: meio acima (padrão Brasil) */
export function arredondar(valor: Decimal): Decimal {
  return valor.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}
