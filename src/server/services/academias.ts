import type { AssinaturaSituacao, PrismaClient } from '@prisma/client'

const FORMAS_PADRAO = ['Dinheiro', 'Pix', 'Cartão de débito', 'Cartão de crédito']

const CATEGORIAS_PADRAO: { nome: string; tipo: 'RECEITA' | 'DESPESA' }[] = [
  { nome: 'Aluguel',                  tipo: 'DESPESA' },
  { nome: 'Água e energia',           tipo: 'DESPESA' },
  { nome: 'Internet e telefone',      tipo: 'DESPESA' },
  { nome: 'Salários e pró-labore',    tipo: 'DESPESA' },
  { nome: 'Manutenção e equipamentos',tipo: 'DESPESA' },
  { nome: 'Limpeza e materiais',      tipo: 'DESPESA' },
  { nome: 'Marketing',                tipo: 'DESPESA' },
  { nome: 'Impostos e taxas',         tipo: 'DESPESA' },
  { nome: 'Outras despesas',          tipo: 'DESPESA' },
  { nome: 'Venda de produtos',        tipo: 'RECEITA' },
  { nome: 'Outras receitas',          tipo: 'RECEITA' },
]

/**
 * Cria a academia já pronta para uso: configuração, formas de pagamento,
 * conta "Caixa" e categorias financeiras iniciais. Tudo ou nada.
 * NÃO verifica permissão: quem chama autoriza antes.
 */
export async function criarAcademiaComPadroes(
  prisma: PrismaClient,
  dados: {
    nome: string
    slug: string
    cidade?: string | null
    estado?: string | null
    assinatura: AssinaturaSituacao
    assinaturaAte?: Date | null
    observacoes?: string | null
  },
) {
  return prisma.$transaction(async (tx) => {
    const academia = await tx.academia.create({
      data: {
        nome:          dados.nome,
        slug:          dados.slug,
        cidade:        dados.cidade || null,
        estado:        dados.estado || null,
        assinatura:    dados.assinatura,
        assinaturaAte: dados.assinaturaAte ?? null,
        observacoes:   dados.observacoes || null,
        situacao:      'ATIVA',
      },
    })

    await tx.academiaConfig.create({ data: { academiaId: academia.id } })
    await tx.formaPagamento.createMany({
      data: FORMAS_PADRAO.map(nome => ({ academiaId: academia.id, nome })),
    })
    await tx.conta.create({ data: { academiaId: academia.id, nome: 'Caixa', tipo: 'CAIXA' } })
    await tx.categoria.createMany({
      data: CATEGORIAS_PADRAO.map(c => ({ academiaId: academia.id, ...c })),
    })

    return academia
  })
}
