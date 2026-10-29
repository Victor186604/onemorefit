import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/server/db/client'
import { requirePlatformAdmin } from '@/server/auth/guards'
import { situacaoConvite } from '@/server/services/convites'
import { ASSINATURA, SITUACAO_ACADEMIA } from '@/lib/labels'
import { formatarData, formatarDataHora } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Aviso } from '@/components/ui/Aviso'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ConfirmarAcao } from '@/components/ui/ConfirmarAcao'
import { DadosAcademiaForm } from '@/features/plataforma/DadosAcademiaForm'
import { AssinaturaForm } from '@/features/plataforma/AssinaturaForm'
import { ConvidarAdminForm } from '@/features/plataforma/ConvidarAdminForm'
import {
  atualizarDadosAcademia, atualizarAssinatura, suspenderAcademia, reativarAcademia,
  convidarAdmin, reenviarConvite, cancelarConvite,
} from '@/features/plataforma/actions'

export const metadata: Metadata = { title: 'Academia' }

const CONVITE_BADGE = {
  pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800' },
  aceito:   { label: 'Aceito',   cls: 'bg-green-100 text-green-700' },
  expirado: { label: 'Expirado ou cancelado', cls: 'bg-gray-100 text-gray-600' },
}

function isoData(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : ''
}

export default async function AcademiaPlataformaPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ criada?: string; convite?: string; avisoConvite?: string }>
}) {
  await requirePlatformAdmin()
  const { id } = await params
  const sp = await searchParams
  const prisma = await db()

  const academia = await prisma.academia.findUnique({ where: { id } })
  if (!academia) notFound()

  // Só dados operacionais. Dados de alunos e financeiros da academia não são exibidos aqui.
  const [admins, convites, totalUsuarios, historico] = await Promise.all([
    prisma.userAcademia.findMany({
      where: { academiaId: id, papel: 'ADMIN' },
      include: { user: { select: { nome: true, email: true, ativo: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.convite.findMany({ where: { academiaId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.userAcademia.count({ where: { academiaId: id, ativo: true } }),
    prisma.auditLog.findMany({
      where: { academiaId: id, entidade: { in: ['Academia', 'Convite'] } },
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, nomeUser: true, descricao: true, createdAt: true },
    }),
  ])

  const sit = SITUACAO_ACADEMIA[academia.situacao]
  const ass = ASSINATURA[academia.assinatura]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Breadcrumbs itens={[{ label: 'Academias', href: '/plataforma/academias' }, { label: academia.nome }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{academia.nome}</h1>
          <Badge cls={sit.cls}>Acesso: {sit.label}</Badge>
          <Badge cls={ass.cls}>Assinatura: {ass.label}</Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Painel em <span className="font-mono">/a/{academia.slug}</span> · criada em {formatarData(academia.createdAt)} ·{' '}
          {totalUsuarios} usuário{totalUsuarios !== 1 ? 's' : ''} com acesso
        </p>
      </div>

      {sp.criada && (
        <Aviso tipo="sucesso">
          Academia criada com formas de pagamento, conta “Caixa” e categorias padrão.
          {sp.convite && ' O convite do administrador foi enviado.'}
        </Aviso>
      )}
      {sp.avisoConvite && <Aviso tipo="erro">A academia foi criada, mas o convite falhou: {sp.avisoConvite}</Aviso>}

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Administradores da academia</h2>
        <p className="text-sm text-gray-500 mb-4">O administrador convidado cria a própria senha e depois cadastra o restante da equipe.</p>

        {admins.length === 0
          ? <p className="text-sm text-gray-400 mb-4">Nenhum administrador ainda.</p>
          : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg mb-4">
              {admins.map(v => (
                <li key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{v.user.nome}</div>
                    <div className="text-gray-500">{v.user.email}</div>
                  </div>
                  {(!v.ativo || !v.user.ativo) && <Badge cls="bg-gray-100 text-gray-600">Sem acesso</Badge>}
                </li>
              ))}
            </ul>
          )}

        <ConvidarAdminForm acao={convidarAdmin.bind(null, id)} />

        {convites.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Convites recentes</h3>
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {convites.map(c => {
                const s = situacaoConvite(c)
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <div className="text-gray-900">{c.email}</div>
                      <div className="text-xs text-gray-500">
                        Enviado em {formatarDataHora(c.createdAt)}
                        {s === 'pendente' && ` · expira em ${formatarDataHora(c.expiresAt)}`}
                        {s === 'aceito' && c.aceitoEm && ` · aceito em ${formatarDataHora(c.aceitoEm)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge cls={CONVITE_BADGE[s].cls}>{CONVITE_BADGE[s].label}</Badge>
                      {s !== 'aceito' && (
                        <ConfirmarAcao
                          tamanho="pequeno" variante="secundario" textoBotao="Reenviar"
                          titulo="Reenviar convite?"
                          descricao={<>Um novo link será enviado para <strong>{c.email}</strong>. Links anteriores deixam de funcionar.</>}
                          textoConfirmar="Reenviar"
                          acao={reenviarConvite.bind(null, c.id)}
                        />
                      )}
                      {s === 'pendente' && (
                        <ConfirmarAcao
                          tamanho="pequeno" variante="perigo" textoBotao="Cancelar"
                          titulo="Cancelar convite?"
                          descricao={<>O link enviado para <strong>{c.email}</strong> deixará de funcionar.</>}
                          textoConfirmar="Cancelar convite"
                          acao={cancelarConvite.bind(null, c.id)}
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Assinatura do OneMoreFit</h2>
          <AssinaturaForm
            inicial={{ assinatura: academia.assinatura, assinaturaAte: isoData(academia.assinaturaAte) }}
            acao={atualizarAssinatura.bind(null, id)}
          />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Acesso ao sistema</h2>
          <p className="text-sm text-gray-500 mb-4">
            {academia.situacao === 'SUSPENSA'
              ? 'O acesso está suspenso: a equipe da academia não consegue entrar no painel. Nenhum dado foi apagado.'
              : 'Suspender bloqueia a entrada da equipe no painel, sem apagar dados. Pode ser revertido a qualquer momento.'}
          </p>
          {academia.situacao === 'ATIVA' && (
            <ConfirmarAcao
              variante="perigo" textoBotao="Suspender acesso"
              titulo={`Suspender ${academia.nome}?`}
              descricao="A equipe e os alunos da academia deixam de acessar o sistema até a reativação. Os dados são preservados."
              pedirMotivo="Motivo da suspensão" textoConfirmar="Suspender acesso"
              acao={suspenderAcademia.bind(null, id)}
            />
          )}
          {academia.situacao === 'SUSPENSA' && (
            <ConfirmarAcao
              textoBotao="Reativar acesso"
              titulo={`Reativar ${academia.nome}?`}
              descricao="A equipe volta a acessar o painel normalmente."
              pedirMotivo="Motivo da reativação" textoConfirmar="Reativar acesso"
              acao={reativarAcademia.bind(null, id)}
            />
          )}
        </section>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Dados básicos</h2>
        <DadosAcademiaForm
          inicial={{
            nome: academia.nome, cidade: academia.cidade ?? '',
            estado: academia.estado ?? '', observacoes: academia.observacoes ?? '',
          }}
          acao={atualizarDadosAcademia.bind(null, id)}
        />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Histórico da plataforma</h2>
        {historico.length === 0
          ? <p className="text-sm text-gray-400">Sem registros.</p>
          : (
            <ul className="space-y-2 text-sm">
              {historico.map(h => (
                <li key={h.id} className="flex gap-3">
                  <span className="text-gray-400 whitespace-nowrap">{formatarDataHora(h.createdAt)}</span>
                  <span className="text-gray-700">{h.descricao} <span className="text-gray-400">— {h.nomeUser ?? 'sistema'}</span></span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
