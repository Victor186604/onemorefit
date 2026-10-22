# OneMoreFit

**Gestão para academias e estúdios**
Uma solução OneMoreCode.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Banco local | PGlite (PostgreSQL em WASM, sem instalação) |
| Banco produção | Neon PostgreSQL (serverless) |
| ORM | Prisma 5 (driver adapters) |
| Autenticação | Auth.js (next-auth v5) |
| Estilo | Tailwind CSS |
| Formulários | React Hook Form + Zod |
| Deploy | Vercel |

---

## Pré-requisitos

- Node.js 18+
- npm 9+

**Não é necessário instalar PostgreSQL localmente.**
Em desenvolvimento, o banco roda via PGlite (arquivo `.pglite/` na raiz).

---

## Instalação local

```bash
git clone <repositório>
cd onemorefit
npm install
```

### Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```env
# Desenvolvimento: deixe DATABASE_URL em branco
# O PGlite será usado automaticamente
DATABASE_URL=

# Gere com: openssl rand -base64 32
AUTH_SECRET=coloque_aqui_uma_chave_longa

NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=0.1.0

# E-mail — deixe em branco em dev (links aparecem no console)
EMAIL_SERVER_HOST=
# ...

# Gere com: openssl rand -hex 32
CRON_SECRET=coloque_aqui_um_secret
```

### Gerar o Prisma Client

```bash
npm run db:generate
```

### Aplicar schema (primeira vez ou após alterar schema.prisma)

**Desenvolvimento (PGlite):**
```bash
npm run db:push
```

**Produção (Neon):**
```bash
npm run db:migrate:deploy
```

### Seed (dados fictícios de demonstração)

```bash
npm run db:seed
```

⚠️ Nunca execute em produção.

Credenciais criadas pelo seed:
| Usuário | E-mail | Senha |
|---------|--------|-------|
| Platform Admin | admin@onemorecode.com.br | admin@onemorefit123 |
| Admin FitLife | admin@fitlife-demo.com | demo@2025 |
| Recepção | recep@fitlife-demo.com | demo@2025 |
| Multi-academia | multi@demo.com | demo@2025 |

### Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Criar o primeiro administrador (produção)

```bash
npm run admin:create
```

O script solicita nome, e-mail e senha de forma interativa.
Nunca usa senha padrão.

---

## Deploy na Vercel

### 1. Banco de dados (Neon)

1. Acesse https://console.neon.tech
2. Crie um projeto com o nome `onemorefit`
3. Crie dois branches: `main` (produção) e `dev` (desenvolvimento/preview)
4. Em **Connection Details**, copie:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DATABASE_URL_DIRECT`

### 2. Aplicar migrations no Neon

```bash
# Com DATABASE_URL e DATABASE_URL_DIRECT apontando para o Neon
npm run db:migrate:dev     # cria a migration
npm run db:migrate:deploy  # aplica no banco
```

### 3. Deploy

1. Suba o código no GitHub
2. Importe o repositório na Vercel
3. Configure as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL` (pooled — Neon)
   - `DATABASE_URL_DIRECT` (direct — Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` (URL de produção)
   - `CRON_SECRET` (`openssl rand -hex 32`)
   - `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`
   - `NEXT_PUBLIC_APP_VERSION`
4. Clique em **Deploy**

### 4. Criar o primeiro administrador em produção

```bash
DATABASE_URL="<url-neon-direct>" npm run admin:create
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Produção | Connection string Neon (pooled). Em dev, deixar vazia usa PGlite. |
| `DATABASE_URL_DIRECT` | Produção | Connection string Neon (direct, para migrations) |
| `AUTH_SECRET` | Sempre | Chave de assinatura de sessões JWT |
| `NEXTAUTH_URL` | Sempre | URL base da aplicação |
| `CRON_SECRET` | Produção | Protege o endpoint de cron |
| `EMAIL_SERVER_HOST` | Produção | Host SMTP |
| `EMAIL_SERVER_PORT` | Produção | Porta SMTP (padrão 587) |
| `EMAIL_SERVER_USER` | Produção | Usuário SMTP |
| `EMAIL_SERVER_PASSWORD` | Produção | Senha SMTP |
| `EMAIL_FROM` | Produção | Endereço remetente |
| `NEXT_PUBLIC_APP_VERSION` | Sempre | Versão exibida na página Sobre |

---

## Estrutura do projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, redefinir senha, convite
│   ├── (platform)/         # Painel administrativo OneMoreCode
│   ├── (academia)/a/[slug] # Painel da academia
│   ├── (aluno)/portal      # Portal do aluno
│   └── api/                # Route Handlers e cron
├── features/               # Módulos por domínio
│   ├── auth/
│   ├── alunos/
│   ├── planos/
│   ├── matriculas/
│   ├── mensalidades/
│   ├── presencas/
│   ├── financeiro/
│   ├── configuracoes/
│   └── dashboard/
├── server/
│   ├── auth/               # Auth.js + sessão
│   ├── db/                 # Prisma client (PGlite/Neon)
│   ├── permissions/        # Matriz de permissões
│   └── services/           # Serviços de domínio
└── lib/
    └── utils.ts            # Formatação, validação

prisma/
├── schema.prisma
└── seed.ts

scripts/
└── create-admin.ts
```

---

## Regras de cobrança

- **Primeira competência:** mês de início da matrícula.
- **Vencimento:** dia configurado na matrícula. Se o dia não existir no mês (ex: dia 31 em fevereiro), usa o último dia do mês.
- **Contratos com prazo:** mensalidades geradas até a data de término.
- **Mensalidades recorrentes:** geradas até 2 meses à frente pelo cron diário.
- **Cancelamento:** interrompe geração. Mensalidades futuras sem recebimento são canceladas com confirmação; pagas e vencidas são preservadas.
- **Arredondamento:** ROUND_HALF_UP, 2 casas decimais.
- **Proporcionalidade:** não implementada no MVP. Sempre cobrança integral.

---

## Isolamento entre academias

Toda consulta ao banco inclui `academiaId` verificado contra o vínculo ativo do usuário autenticado. IDs recebidos do navegador não provam autorização.

---

## Limitações conhecidas (MVP)

- Turmas e professores: não implementados (Etapa 2)
- Renovação automática de matrículas: não implementada
- Trancamento de matrícula: não implementado
- Pagamentos automáticos (Pix, boleto): não implementados (Etapa 3)
- Upload de arquivos: não implementado — logotipo por URL HTTPS
- Aplicativo nativo: não previsto

---

© 2024 OneMoreCode. Todos os direitos reservados.
Software proprietário. Uso restrito a clientes da OneMoreCode.
