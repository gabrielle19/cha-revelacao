# Chá Revelação — Bernardo ou Maria Júlia?

Site de convite digital para um chá revelação, feito para abrir principalmente no
celular (link enviado pelo WhatsApp). Ao abrir, um envelope se abre sozinho e
revela a página principal com local, traje, sugestão de presente e confirmação de
presença. Há uma página `/admin` (pública, sem senha) para a dona do evento
acompanhar as confirmações e os recadinhos.

É um **site 100% estático**: o Next.js é exportado (`output: "export"`) e todo o
acesso ao banco é feito direto do navegador com a chave pública (anon) do Supabase.
A segurança fica a cargo das regras (RLS) do Postgres.

## Stack

- **Next.js 14 (App Router) + TypeScript** — exportado como site estático
- **Tailwind CSS**
- **Supabase (Postgres)** — confirmações, recadinhos e sugestões de presente,
  acessado direto do cliente com a chave anon (RLS garante a segurança)
- **Framer Motion** (animações) e **canvas-confetti** (confetes)
- Deploy no **Render** como **Static Site** (grátis, sem cold start)

---

## 1. Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha os valores (veja abaixo)
npm run dev
```

Acesse `http://localhost:3000`. A página de acompanhamento fica em `/admin`.

Para gerar a versão estática (igual à publicada), rode `npm run build` — os
arquivos saem na pasta `out/`.

---

## 2. Configurar o Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Não é mais necessária a `service_role` — não existe servidor.
3. No **SQL Editor** do Supabase, execute, **nesta ordem**, o conteúdo de:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_messages.sql`
   - `supabase/migrations/0003_public_rls.sql`

As migrações criam as tabelas `gift_quotas`, `gift_assignments`, `rsvps` e
`messages`, a função atômica `assign_gift` e as regras (RLS) que permitem, para a
chave pública (`anon`):

- **inserir** confirmações e recadinhos e **atualizar** a própria confirmação;
- **ler** confirmações, recadinhos e cotas (o painel `/admin` é público);
- **nunca apagar** dados pelo site (não há policy de `delete`).

> **Excluir registros:** use o **Table Editor** do próprio Supabase (suas
> credenciais de dono). Nenhuma exclusão é possível pela chave pública.

> **Cotas:** cada tamanho (P, M, G, GG) começa com cota de 20. Para ajustar, edite
> a coluna `quota` na tabela `gift_quotas`.

---

## 3. Variáveis de ambiente

Todas são públicas (`NEXT_PUBLIC_*`) e ficam embutidas no build — é normal a chave
anon aparecer no código do navegador. Crie `.env.local` (local) ou configure no
Render (produção):

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (ex.: `https://cha-revelacao.onrender.com`) |

---

## 4. Deploy no Render (Static Site)

1. Suba o repositório no GitHub.
2. No Render, crie um **Static Site** apontando para o repositório. O arquivo
   `render.yaml` na raiz já define:
   - Build: `npm ci && npm run build`
   - Publish directory: `out`
3. Em **Environment**, preencha as três variáveis da tabela acima.
4. Após o deploy, defina `NEXT_PUBLIC_SITE_URL` com a URL final e faça um novo
   deploy para os metadados Open Graph usarem a URL correta.

O site é servido como arquivos estáticos: carrega instantaneamente, sem tempo de
espera de "acordar".

---

## 5. Como funciona

- **Abertura automática:** o envelope abre sozinho (sem clique nem som), com um
  botão "Pular". Respeita `prefers-reduced-motion` e não repete na mesma sessão
  (`sessionStorage`).
- **Sugestão de presente:** o cliente chama a função `assign_gift` (RPC) com um
  `visitor_id` (gerado com `crypto.randomUUID()` e guardado no `localStorage`).
  A função roda por dentro do banco (`security definer`), sorteia um tamanho com
  cota disponível de forma atômica (lock por linha) e devolve sempre o mesmo
  tamanho para o mesmo visitante — mesmo com dois cliques simultâneos.
- **Confirmação:** o cliente valida com **zod** e faz *upsert* por telefone
  (não duplica) direto na tabela `rsvps`. Tem honeypot e um limite simples de
  "1 a cada 10s" por aba, só para evitar duplo clique.
- **Admin:** página pública (sem senha), marcada como `noindex`. Lê `rsvps`,
  `gift_quotas` e `messages` direto do Supabase com a chave pública. Permite
  buscar, exportar CSV e imprimir; a exclusão só é feita pelo painel do Supabase.
- **Raspadinha:** o modal de presente revela o tamanho sorteado com uma camada
  dourada raspável (`<canvas>`), confetes e vibração ao concluir.
- **Contagem regressiva:** dias/horas/minutos até `EVENT.dateISO` (fuso de
  Brasília), calculada só no cliente para evitar erro de hidratação.
- **Mural de recadinhos:** o cliente insere mensagens na tabela `messages`
  (zod + honeypot), visíveis no painel `/admin`, com exportação CSV e versão para
  imprimir (`/admin/recados/imprimir`).

---

## 6. Estrutura

```
public/
  og-image.png            # imagem OG 1200x630 (estática); og-image.svg é a fonte
src/
  app/
    page.tsx              # abertura + página principal
    layout.tsx            # fontes, metadados, Open Graph
    icon.svg              # favicon (ursinho)
    admin/page.tsx        # painel público (client component)
    admin/recados/imprimir/page.tsx
  components/             # UI (envelope, modais, dashboard, etc.)
  lib/
    supabase-browser.ts   # cliente Supabase (navegador, chave anon)
    admin-data.ts         # leitura dos dados do painel
    validation.ts         # schemas zod
    throttle.ts           # limite anti-duplo-clique (por aba)
    event.ts, visitor.ts
supabase/migrations/      # 0001 init · 0002 messages · 0003 RLS pública
render.yaml
next.config.mjs           # output: "export"
```
