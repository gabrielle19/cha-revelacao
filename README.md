# Chá Revelação — Bernardo ou Maria Júlia?

Site de convite digital para um chá revelação, feito para abrir principalmente no
celular (link enviado pelo WhatsApp). Ao abrir, um envelope se abre sozinho e
revela a página principal com local, traje, sugestão de presente e confirmação de
presença. Há uma área administrativa protegida por senha para a dona do evento
acompanhar as confirmações.

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS**
- **Supabase (Postgres)** — confirmações e distribuição de sugestões de presente
- **Framer Motion** (animações) e **canvas-confetti** (confetes)
- Deploy no **Render** como Web Service (Node)

---

## 1. Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha os valores (veja abaixo)
npm run dev
```

Acesse `http://localhost:3000`. A área da dona do evento fica em `/admin`.

---

## 2. Configurar o Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta, só no servidor)
3. Rode a migração. Duas opções:

   **Opção A — SQL Editor (mais simples):**
   Abra **SQL Editor** no painel do Supabase e execute, em ordem, o conteúdo de
   `supabase/migrations/0001_init.sql` e depois `supabase/migrations/0002_messages.sql`.

   **Opção B — Supabase CLI:**
   ```bash
   npm i -g supabase
   supabase link --project-ref <ref-do-projeto>
   supabase db push
   ```

A migração cria as tabelas `gift_quotas`, `gift_assignments` e `rsvps`, ativa RLS
(sem policies para `anon` — todo acesso passa pelo servidor com a service role) e a
função atômica `assign_gift`.

> **Cotas:** cada tamanho (P, M, G, GG) começa com cota de 20. Para ajustar, edite
> a coluna `quota` na tabela `gift_quotas`.

---

## 3. Variáveis de ambiente

Crie `.env.local` (local) ou configure no Render (produção):

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (**secreta**, nunca no cliente) |
| `ADMIN_PASSWORD` | Senha da área `/admin` |
| `ADMIN_SESSION_SECRET` | String longa e aleatória para assinar o cookie de sessão |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (ex.: `https://cha-revelacao.onrender.com`) |

Gere um segredo forte para `ADMIN_SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Deploy no Render

1. Suba o repositório no GitHub.
2. No Render, crie um **Web Service** apontando para o repositório. O arquivo
   `render.yaml` na raiz já define:
   - Build: `npm ci && npm run build`
   - Start: `npm start`
3. Em **Environment**, preencha as variáveis da tabela acima.
   `ADMIN_SESSION_SECRET` pode ser gerado automaticamente pelo Render
   (`generateValue: true`).
4. Após o deploy, defina `NEXT_PUBLIC_SITE_URL` com a URL final e faça um novo
   deploy para os metadados Open Graph usarem a URL correta.

O `npm start` respeita a variável `PORT` fornecida pelo Render.

---

## 5. Como funciona

- **Abertura automática:** o envelope abre sozinho (sem clique nem som), com um
  botão "Pular". Respeita `prefers-reduced-motion` e não repete na mesma sessão
  (`sessionStorage`).
- **Sugestão de presente:** o cliente chama `POST /api/gift` com um `visitor_id`
  (gerado com `crypto.randomUUID()` e guardado no `localStorage`). O servidor
  executa a função `assign_gift` (RPC) que sorteia um tamanho com cota disponível
  de forma atômica (lock por linha) e devolve sempre o mesmo tamanho para o mesmo
  visitante.
- **Confirmação:** `POST /api/rsvp` valida com **zod** (cliente e servidor), tem
  honeypot e rate limit por IP, e faz *upsert* por telefone (não duplica).
- **Admin:** protegido por senha via cookie assinado (HMAC) e `middleware.ts`.
  Todos os dados sensíveis são lidos no servidor com a service role key.
- **Fundo interativo:** ursinhos/patinhas/corações flutuam (GSAP) e reagem à
  inclinação do celular (parallax via `DeviceOrientationEvent`; no iPhone a
  permissão é pedida no primeiro toque) ou ao mouse no desktop.
- **Raspadinha:** o modal de presente revela o tamanho sorteado com uma camada
  dourada raspável (`<canvas>`), confetes e vibração ao concluir.
- **Contagem regressiva:** dias/horas/minutos até `EVENT.dateISO` (fuso de
  Brasília), calculada só no cliente para evitar erro de hidratação.
- **Mural de recadinhos:** `POST /api/messages` (zod + honeypot + rate limit)
  grava mensagens privadas na tabela `messages`, visíveis só no painel
  (`/admin`), com exportação CSV e versão para imprimir (`/admin/recados/imprimir`).

---

## 6. Estrutura

```
src/
  app/
    page.tsx              # abertura + página principal
    layout.tsx            # fontes, metadados
    opengraph-image.tsx   # imagem OG 1200x630
    icon.tsx              # favicon (ursinho)
    admin/page.tsx        # login + dashboard
    api/
      gift/route.ts       # sorteio de presente
      rsvp/route.ts       # confirmação
      admin/…             # login, logout, export, delete (protegidas)
  components/             # UI (envelope, modais, dashboard, etc.)
  lib/                    # supabase, auth, validação, rate-limit, dados
supabase/migrations/     # SQL inicial
render.yaml
```
