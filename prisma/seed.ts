/**
 * Seed de desenvolvimento — dados fictícios para testes.
 *
 * NUNCA execute em produção.
 * Protegido por verificação de NODE_ENV.
 *
 * Execução: npm run db:seed
 */

import { getPrisma } from '../src/server/db/client'
import { hash } from 'bcryptjs'
import { addMonths, subMonths, subDays, addDays } from 'date-fns'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERRO: seed não pode ser executado em produção.')
    process.exit(1)
  }

  const prisma = await getPrisma()
  console.log('Iniciando seed...')

  // Platform Admin
  const adminHash = await hash('admin@onemorefit123', 12)
  const platformAdmin = await prisma.user.upsert({
    where:  { email: 'admin@onemorecode.com.br' },
    update: {},
    create: {
      nome:      'Admin OneMoreCode',
      email:     'admin@onemorecode.com.br',
      senhaHash: adminHash,
      platformAdmin: { create: {} },
    },
  })
  console.log('Platform admin:', platformAdmin.email)

  // Academia 1 — FitLife
  const fitlife = await prisma.academia.upsert({
    where:  { slug: 'fitlife-demo' },
    update: {},
    create: {
      slug:    'fitlife-demo',
      nome:    'FitLife Academia',
      email:   'contato@fitlife.com.br',
      telefone:'(11) 3333-4444',
      cidade:  'São Paulo',
      estado:  'SP',
      situacao:'ATIVA',
      assinatura: 'ATIVA',
    },
  })

  // Academia 2 — Estúdio Forma
  const forma = await prisma.academia.upsert({
    where:  { slug: 'forma-demo' },
    update: {},
    create: {
      slug:    'forma-demo',
      nome:    'Estúdio Forma',
      email:   'contato@forma.com.br',
      telefone:'(21) 2222-3333',
      cidade:  'Rio de Janeiro',
      estado:  'RJ',
      situacao:'ATIVA',
      assinatura: 'TRIAL',
    },
  })

  // Senhas dos usuários de demonstração
  const senhaDemo = await hash('demo@2025', 12)

  // Usuário admin fitlife
  const adminFitlife = await prisma.user.upsert({
    where:  { email: 'admin@fitlife-demo.com' },
    update: {},
    create: {
      nome: 'Carlos Admin', email: 'admin@fitlife-demo.com', senhaHash: senhaDemo,
    },
  })
  await prisma.userAcademia.upsert({
    where:  { userId_academiaId: { userId: adminFitlife.id, academiaId: fitlife.id } },
    update: {},
    create: { userId: adminFitlife.id, academiaId: fitlife.id, papel: 'ADMIN' },
  })

  // Usuário recepção fitlife
  const recepFitlife = await prisma.user.upsert({
    where:  { email: 'recep@fitlife-demo.com' },
    update: {},
    create: {
      nome: 'Ana Recepção', email: 'recep@fitlife-demo.com', senhaHash: senhaDemo,
    },
  })
  await prisma.userAcademia.upsert({
    where:  { userId_academiaId: { userId: recepFitlife.id, academiaId: fitlife.id } },
    update: {},
    create: { userId: recepFitlife.id, academiaId: fitlife.id, papel: 'RECEPCAO' },
  })

  // Usuário vinculado às duas academias
  const multiUser = await prisma.user.upsert({
    where:  { email: 'multi@demo.com' },
    update: {},
    create: {
      nome: 'João Múltiplo', email: 'multi@demo.com', senhaHash: senhaDemo,
    },
  })
  await prisma.userAcademia.upsert({
    where:  { userId_academiaId: { userId: multiUser.id, academiaId: fitlife.id } },
    update: {},
    create: { userId: multiUser.id, academiaId: fitlife.id, papel: 'FINANCEIRO' },
  })
  await prisma.userAcademia.upsert({
    where:  { userId_academiaId: { userId: multiUser.id, academiaId: forma.id } },
    update: {},
    create: { userId: multiUser.id, academiaId: forma.id, papel: 'ADMIN' },
  })

  // Planos da FitLife
  const planoMensal = await prisma.plano.upsert({
    where:  { id: 'seed-plano-mensal' },
    update: {},
    create: {
      id:           'seed-plano-mensal',
      academiaId:   fitlife.id,
      nome:         'Mensal',
      descricao:    'Acesso livre aos equipamentos',
      modalidade:   'Musculação',
      tipoDuracao:  'MENSAL_RECORRENTE',
      valor:        120.00,
      taxaMatricula:50.00,
    },
  })

  const planoTrimestral = await prisma.plano.upsert({
    where:  { id: 'seed-plano-trim' },
    update: {},
    create: {
      id:          'seed-plano-trim',
      academiaId:  fitlife.id,
      nome:        'Trimestral',
      descricao:   'Contrato de 3 meses',
      modalidade:  'Musculação',
      tipoDuracao: 'CONTRATO_PRAZO',
      duracaoMeses:3,
      valor:       110.00,
    },
  })

  // Formas de pagamento
  const [fpPix, fpCartao, fpDinheiro] = await Promise.all([
    prisma.formaPagamento.upsert({ where: { id: 'seed-fp-pix' }, update: {}, create: { id: 'seed-fp-pix', academiaId: fitlife.id, nome: 'Pix' } }),
    prisma.formaPagamento.upsert({ where: { id: 'seed-fp-cartao' }, update: {}, create: { id: 'seed-fp-cartao', academiaId: fitlife.id, nome: 'Cartão de débito' } }),
    prisma.formaPagamento.upsert({ where: { id: 'seed-fp-din' }, update: {}, create: { id: 'seed-fp-din', academiaId: fitlife.id, nome: 'Dinheiro' } }),
  ])

  // Categorias
  await Promise.all([
    prisma.categoria.upsert({ where: { id: 'seed-cat-aluguel' }, update: {}, create: { id: 'seed-cat-aluguel', academiaId: fitlife.id, nome: 'Aluguel', tipo: 'DESPESA' } }),
    prisma.categoria.upsert({ where: { id: 'seed-cat-mens' }, update: {}, create: { id: 'seed-cat-mens', academiaId: fitlife.id, nome: 'Mensalidades', tipo: 'RECEITA' } }),
  ])

  // Contas
  await prisma.conta.upsert({ where: { id: 'seed-conta-caixa' }, update: {}, create: { id: 'seed-conta-caixa', academiaId: fitlife.id, nome: 'Caixa', tipo: 'CAIXA' } })

  // Alunos
  const alunos = [
    { id: 'seed-aluno-1', nome: 'Maria Oliveira', email: 'maria@demo.com', telefone: '(11) 91111-1111', cpf: null },
    { id: 'seed-aluno-2', nome: 'João Santos',    email: 'joao@demo.com',  telefone: '(11) 92222-2222', cpf: null },
    { id: 'seed-aluno-3', nome: 'Ana Costa',      email: 'ana@demo.com',   telefone: '(11) 93333-3333', cpf: null },
    { id: 'seed-aluno-4', nome: 'Pedro Lima',     email: null,             telefone: '(11) 94444-4444', cpf: null },
    { id: 'seed-aluno-5', nome: 'Carla Mendes',   email: null,             telefone: '(11) 95555-5555', cpf: null },
  ]

  for (const a of alunos) {
    await prisma.aluno.upsert({ where: { id: a.id }, update: {}, create: { ...a, academiaId: fitlife.id } })
  }

  // Matrículas e mensalidades
  const hoje = new Date()
  const { gerarMensalidadesMatricula } = await import('../src/server/services/mensalidades')

  for (let i = 0; i < alunos.length; i++) {
    const alunoId   = alunos[i].id
    const matId     = `seed-mat-${i + 1}`
    const diaVenc   = 10
    const inicio    = subMonths(hoje, i < 3 ? 2 : 1)
    const situacao  = i < 4 ? 'ATIVA' : 'ENCERRADA'

    await prisma.matricula.upsert({
      where:  { id: matId },
      update: {},
      create: {
        id:               matId,
        academiaId:       fitlife.id,
        alunoId,
        planoId:          planoMensal.id,
        planoNome:        planoMensal.nome,
        planoTipo:        'MENSAL_RECORRENTE',
        valorContratado:  planoMensal.valor,
        taxaMatricula:    i === 0 ? planoMensal.taxaMatricula : null,
        diaVencimento:    diaVenc,
        dataInicio:       inicio,
        situacao:         situacao as any,
      },
    })

    if (situacao === 'ATIVA') {
      const mat = await prisma.matricula.findUnique({
        where: { id: matId },
        include: { plano: true },
      })
      if (mat) await gerarMensalidadesMatricula(prisma, mat as any)
    }
  }

  // Registrar alguns recebimentos
  const mens = await prisma.mensalidade.findMany({
    where: { academiaId: fitlife.id, situacao: 'EM_ABERTO' },
    take: 3,
  })
  const { registrarRecebimento } = await import('../src/server/services/mensalidades')
  const { Decimal } = await import('decimal.js')

  for (const m of mens.slice(0, 2)) {
    try {
      await registrarRecebimento(prisma, {
        mensalidadeId: m.id,
        academiaId:    fitlife.id,
        valor:         new Decimal(m.valorOriginal.toString()),
        formaPgtoId:   fpPix.id,
        formaPgtoNome: fpPix.nome,
        dataPagamento: subDays(hoje, 5),
        userId:        adminFitlife.id,
      })
    } catch { /* pode já estar paga */ }
  }

  // Presenças
  for (let d = 0; d < 7; d++) {
    const data = subDays(hoje, d)
    for (const a of alunos.slice(0, 3)) {
      try {
        await prisma.presenca.create({
          data: {
            academiaId: fitlife.id,
            alunoId: a.id,
            dataHora: new Date(data.getFullYear(), data.getMonth(), data.getDate(), 9, 0),
            registradaPor: recepFitlife.id,
          },
        })
      } catch { /* ignore duplicados */ }
    }
  }

  console.log('\nSeed concluído!')
  console.log('─'.repeat(50))
  console.log('Credenciais de demonstração (somente desenvolvimento):')
  console.log('Platform Admin: admin@onemorecode.com.br / admin@onemorefit123')
  console.log('Admin FitLife:  admin@fitlife-demo.com / demo@2025')
  console.log('Recepção:       recep@fitlife-demo.com / demo@2025')
  console.log('Multi-academia: multi@demo.com / demo@2025')
  console.log('─'.repeat(50))
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1) })
