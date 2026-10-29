/**
 * Serviço de e-mail.
 * Em desenvolvimento sem credenciais SMTP: exibe o link no console.
 * Em produção: usa nodemailer com as variáveis de ambiente configuradas.
 */

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(params: SendEmailParams) {
  const host = process.env.EMAIL_SERVER_HOST

  if (!host) {
    // Desenvolvimento sem SMTP — exibe no console
    console.log('\n[EMAIL — ambiente sem SMTP]')
    console.log('Para:', params.to)
    console.log('Assunto:', params.subject)
    console.log('Conteúdo:\n', params.text ?? params.html)
    console.log('─'.repeat(60))
    return
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@onemorefit.com.br',
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}

/** Evita que nomes digitados (academia, pessoa) injetem HTML no e-mail. */
function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const COR = '#961019'

function moldura(conteudo: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f1f1f">
      <h2 style="color:${COR};margin-bottom:16px">OneMoreFit</h2>
      ${conteudo}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Uma solução OneMoreCode</p>
    </div>
  `
}

function botao(link: string, texto: string): string {
  return `<p><a href="${esc(link)}" style="display:inline-block;background:${COR};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">${esc(texto)}</a></p>`
}

export function emailResetSenha(link: string, nome: string): string {
  return moldura(`
    <p>Olá, ${esc(nome)}!</p>
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    ${botao(link, 'Redefinir senha')}
    <p style="color:#666;font-size:13px">
      Este link expira em 1 hora e pode ser usado apenas uma vez.<br>
      Se não foi você que pediu, ignore este e-mail.
    </p>
  `)
}

export function emailConvite(link: string, academia: string, papel: string): string {
  return moldura(`
    <p>Você foi convidado para acessar <strong>${esc(academia)}</strong> no OneMoreFit como <strong>${esc(papel)}</strong>.</p>
    ${botao(link, 'Aceitar convite')}
    <p style="color:#666;font-size:13px">
      Este convite expira em 48 horas e pode ser usado apenas uma vez.<br>
      Se você não esperava este convite, ignore este e-mail.
    </p>
  `)
}
