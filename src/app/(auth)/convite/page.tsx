import type { Metadata } from 'next'
import Link from 'next/link'
import { auth, signOut } from '@/server/auth'
import { db } from '@/server/db/client'
import { hashToken } from '@/lib/tokens'
import { PAPEL_LABEL } from '@/lib/labels'
import { AuthShell } from '@/components/layout/AuthShell'
import { Aviso } from '@/components/ui/Aviso'
import { botaoCls } from '@/components/ui/Botao'
import { NovaContaForm } from '@/features/convite/NovaContaForm'
import { AceitarLogadoBotao } from '@/features/convite/AceitarLogadoBotao'

export const metadata: Metadata = { title: 'Convite', robots: { index: false } }

function Indisponivel({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <AuthShell subtitulo="Convite de acesso">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{titulo}</h2>
      <p className="text-sm text-gray-600 mb-6">{texto}</p>
      <Link href="/login" className={botaoCls('secundario')}>Ir para o login</Link>
    </AuthShell>
  )
}

export default async function ConvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token || token.length < 20 || token.length > 200) {
    return <Indisponivel titulo="Convite inválido" texto="O link do convite está incompleto. Confira se copiou o endereço inteiro do e-mail." />
  }

  const prisma = await db()
  const convite = await prisma.convite.findUnique({
    where: { token: hashToken(token) },
    include: { academia: { select: { nome: true, situacao: true } } },
  })

  if (!convite) {
    return <Indisponivel titulo="Convite inválido" texto="Este link não é válido. Peça um novo convite a quem te convidou." />
  }
  if (convite.aceitoEm) {
    return <Indisponivel titulo="Convite já utilizado" texto="Este convite já foi aceito. Entre com seu e-mail e senha." />
  }
  if (convite.expiresAt <= new Date()) {
    return <Indisponivel titulo="Convite expirado" texto="Este convite expirou ou foi cancelado. Peça um novo convite a quem te convidou." />
  }
  if (convite.academia.situacao !== 'ATIVA') {
    return <Indisponivel titulo="Acesso indisponível" texto="O acesso desta academia está indisponível no momento." />
  }

  const sessao  = await auth()
  const logado  = sessao?.user?.id
    ? await prisma.user.findUnique({ where: { id: sessao.user.id }, select: { email: true } })
    : null
  const temConta = logado ? true : Boolean(
    await prisma.user.findUnique({ where: { email: convite.email }, select: { id: true } }),
  )
  const voltarAqui = `/convite?token=${encodeURIComponent(token)}`

  return (
    <AuthShell subtitulo="Convite de acesso">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Você foi convidado</h2>
      <p className="text-sm text-gray-600 mb-6">
        Acesso a <strong>{convite.academia.nome}</strong> como <strong>{PAPEL_LABEL[convite.papel]}</strong>.
      </p>

      {logado && logado.email.toLowerCase() === convite.email && (
        <>
          <p className="text-sm text-gray-600 mb-4">Você está conectado como <strong>{logado.email}</strong>.</p>
          <AceitarLogadoBotao token={token} />
        </>
      )}

      {logado && logado.email.toLowerCase() !== convite.email && (
        <div className="space-y-4">
          <Aviso tipo="info">
            Este convite foi enviado para <strong>{convite.email}</strong>, mas você está conectado como{' '}
            <strong>{logado.email}</strong>. Saia e entre com a conta certa.
          </Aviso>
          <form action={async () => { 'use server'; await signOut({ redirectTo: voltarAqui }) }}>
            <button type="submit" className={botaoCls('secundario', 'w-full')}>Sair desta conta</button>
          </form>
        </div>
      )}

      {!logado && temConta && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Já existe uma conta para <strong>{convite.email}</strong>. Entre com sua senha para aceitar o convite.
          </p>
          <Link href={`/login?callbackUrl=${encodeURIComponent(voltarAqui)}`} className={botaoCls('primario', 'w-full')}>
            Entrar para aceitar
          </Link>
        </div>
      )}

      {!logado && !temConta && <NovaContaForm token={token} email={convite.email} />}
    </AuthShell>
  )
}
