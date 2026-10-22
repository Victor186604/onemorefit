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

export function emailResetSenha(link: string, nome: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1d4ed8">OneMoreFit</h2>
      <p>Olá, ${nome}!</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>
        <a href="${link}" style="
          display:inline-block;background:#1d4ed8;color:#fff;
          padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600
        ">Redefinir senha</a>
      </p>
      <p style="color:#666;font-size:13px">
        Este link expira em 1 hora e pode ser usado apenas uma vez.<br>
        Se não solicitou, ignore este e-mail.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Uma solução OneMoreCode</p>
    </div>
  `
}

export function emailConvite(link: string, academia: string, papel: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1d4ed8">OneMoreFit</h2>
      <p>Você foi convidado para acessar <strong>${academia}</strong> como <strong>${papel}</strong>.</p>
      <p>
        <a href="${link}" style="
          display:inline-block;background:#1d4ed8;color:#fff;
          padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600
        ">Aceitar convite</a>
      </p>
      <p style="color:#666;font-size:13px">
        Este convite expira em 48 horas.<br>
        Se não esperava este convite, ignore este e-mail.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Uma solução OneMoreCode</p>
    </div>
  `
}
