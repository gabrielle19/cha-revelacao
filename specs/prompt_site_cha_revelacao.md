# Prompt: Site do Chá Revelação — Bernardo ou Maria Júlia?

Quero que você desenvolva um site de convite digital para um chá revelação. É um projeto simples, mas os detalhes visuais e a experiência no celular são muito importantes, porque a maioria dos convidados vai abrir pelo link recebido no WhatsApp. Leia tudo antes de começar e siga as especificações abaixo.

---

## 1. Stack e hospedagem

- **Next.js 14+ (App Router) com TypeScript** e **Tailwind CSS**.
- **Supabase** (Postgres) para armazenar confirmações de presença e a distribuição das sugestões de presente.
- Deploy no **Render** como *Web Service* (Node), com `npm run build` e `npm start`. Inclua um `render.yaml` na raiz.
- Toda comunicação com o Supabase que envolva leitura de dados sensíveis (lista de convidados) deve acontecer **no servidor** (Route Handlers / Server Actions) usando a `SUPABASE_SERVICE_ROLE_KEY`. Essa chave **nunca** pode ir para o cliente.
- Variáveis de ambiente (crie um `.env.example`):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ADMIN_PASSWORD=
  ADMIN_SESSION_SECRET=
  NEXT_PUBLIC_SITE_URL=
  ```

---

## 2. Identidade visual (seguir à risca)

O site precisa ter a mesma cara do convite em PDF que os convidados recebem.

**Paleta**
| Uso | Cor |
|---|---|
| Fundo claro / off-white | `#FAF6F0` e `#FBF7F1` |
| Bege | `#E8DCC8` / `#F1E6D6` |
| Caramelo (ursinho) | `#C9A574` |
| Marrom médio (labels) | `#B08968` / `#8B6F52` |
| Marrom escuro (texto e botões) | `#5C4433` |
| Branco (cards) | `#FFFFFF` |

**Fundo da página:** degradê `linear-gradient(165deg, #FBF7F1 0%, #F1E6D6 45%, #E3CFB4 100%)`, ocupando a tela inteira (`min-height: 100dvh`, fixo ao rolar), com uma **estampa de ursinhos, patinhas e coraçõezinhos** espalhados, em SVG inline, cor `#A6805C` com opacidade entre 0.14 e 0.22 (corações em `#C9A574`, opacidade ~0.45). A estampa fica atrás do conteúdo (`z-index` negativo com `isolation: isolate` no container) e não pode atrapalhar a leitura nem capturar cliques (`pointer-events: none`).

**Ursinho:** cabeça de urso em SVG, estilo flat e fofo: orelhas e rosto `#C9A574`, parte interna das orelhas `#8B6F52`, focinho `#FAF6F0`, olhos/nariz/sorriso `#5C4433`.

**Tipografia (Google Fonts via `next/font`):**
- Títulos: **Fraunces** (700).
- Textos e botões: **Quicksand** (500–700).

**Estilo geral:** cards brancos com borda `2px solid #E8DCC8` e cantos bem arredondados (20–24px), botões em pílula marrom escuro com texto off-white, sombras suaves em tom marrom (`rgba(92,68,51,0.18)`). Nada de emoji na interface, use ícones em SVG de traço (ex.: `lucide-react`).

---

## 3. Abertura automática do envelope (primeira coisa que o convidado vê)

O convidado chega ao site clicando no envelope do convite em PDF. Por isso, **o site já abre com o envelope se abrindo sozinho, sem precisar de nenhum clique**: é a continuação natural do toque que a pessoa deu no PDF. A tela de abertura tem o mesmo fundo (degradê + estampa de ursinhos) e, no centro, o **envelope fechado idêntico ao do convite em PDF**. Recrie-o em SVG inline:

- Envelope **realista, estilo papel**, visto de trás, cantos quase retos (raio 3px), cor **bege caramelo** (`#D8C1A0`), com sombra projetada suave em marrom (deslocada para baixo e para a direita).
- Abas com leves degradês para dar volume: aba superior (fechada, apontando para baixo até o selo) `#D9C2A1 → #CFB590`, laterais `#D6BE9C`/`#DCC6A6`, inferior `#D1B893 → #DDC8A9`. Vincos finos em `#A88B66` com baixa opacidade e uma sombra sutil sob a borda da aba superior.
- **Textura de papel** por cima de tudo (SVG `feTurbulence` em escala de cinza com opacidade ~0.10, mais uma mancha de baixa frequência ~0.07).
- **Selo de cera dourado/caramelo** na ponta da aba: borda orgânica irregular (`feDisplacementMap`), degradê radial `#E2C48F → #C9A06A → #8A6440`, anel em relevo e, no centro, um **disco marrom `#8B6F52` com pesponto pontilhado** e o **ursinho fofo colorido**: rosto e orelhas `#C9A574`, interior das orelhas `#A6805C`, focinho `#FAF6F0`, olhinhos `#5C4433` com brilho branco, sorriso e bochechinhas rosadas `#E8B9A0`. Reflexo de luz discreto na borda da cera e sombra projetada.

Acima do envelope: selo "CHÁ REVELAÇÃO" e a frase *"Um amor que já é impossível de medir, uma espera cheia de sonhos e uma surpresa que ainda ninguém conhece…"*. Abaixo do envelope, nada além do botão "Pular" discreto.

**Sequência automática** (começa sozinha assim que a página carrega e as fontes estiverem prontas; total de ~3s, usando **Framer Motion**):
1. **Entrada (0–0,8s):** o envelope surge com fade + leve subida e fica parado por um instante, "respirando" (escala 1 → 1.02), para a pessoa reconhecer o mesmo envelope do PDF.
2. **Selo (0,8–1,3s):** o selo dá um pequeno "pulo" (escala 1.15), um brilho passa por ele e ele se solta, caindo com fade.
3. **Aba (1,3–1,9s):** a aba superior **gira em 3D** para cima (`rotateX` de 0 a 180°, `transform-origin` na borda superior, `perspective` no container), revelando o interior do envelope em tom bege mais claro.
4. **Cartão (1,9–2,6s):** um cartão off-white sobe de dentro do envelope, com o ursinho fofo e a data "21 · 11 · 2026 — 13h".
5. **Confetes (a partir de 2,2s):** chuva leve de confetes e coraçõezinhos em tons da paleta (off-white, bege, caramelo, marrom, sem cores fortes) por ~1,5s (`canvas-confetti` com cores customizadas ou partículas próprias).
6. **Transição (2,6–3,2s):** o cartão cresce até ocupar a tela e dá lugar à página principal, que entra com suas animações escalonadas.

**Regras da abertura:**
- Botão discreto **"Pular"** no canto durante a animação, para quem quiser ir direto ao conteúdo.
- A animação **não depende de clique nem de som**, para funcionar igual no navegador interno do WhatsApp, Instagram e em qualquer celular.
- Se `prefers-reduced-motion` estiver ativo, substitua a sequência por um fade simples.
- Salve no `sessionStorage` que o envelope já foi aberto, para não repetir a animação ao recarregar a página na mesma sessão. Se a pessoa voltar outro dia, a abertura aparece de novo.
- Toda a animação precisa rodar liso (60fps) em celulares medianos: anime apenas `transform` e `opacity`, sem animar `width`/`height`/`box-shadow`.

---

## 4. Página principal `/` (logo após a abertura automática)

Mobile-first (base 390px de largura), centralizada, com largura máxima de ~560px no desktop.

Ordem dos elementos:

1. **Selo "CHÁ REVELAÇÃO"** em pílula bege, letras espaçadas.
2. **Ursinho** animado (leve balanço ou flutuação contínua, suave).
3. **Título:** `Bernardo` *ou* `Maria Júlia?`, com o "ou" menor, em Quicksand itálico `#B08968`.
4. **Data e horário** em dois chips: `21 de novembro de 2026` e `13h`.
5. **Versículo bíblico** em um card delicado, itálico, com a referência abaixo. Use um destes (tradução Almeida):
   - *"Herança do Senhor são os filhos; o fruto do ventre, seu galardão."* — Salmos 127:3
   - *"Antes que te formasse no ventre, te conheci."* — Jeremias 1:5
6. **Texto emocionante** (na voz do bebê):
   > "Mesmo antes de chegar, eu já sinto o amor que me espera. A mamãe e o papai sonham comigo todos os dias, contam os meses, imaginam meu rostinho e preparam cada detalhe com carinho. Agora chegou a hora de descobrir o meu primeiro segredo, e seria muito especial ter você pertinho nesse momento. Vem descobrir com a gente se eu sou o Bernardo ou a Maria Júlia!"
7. **Grade de 4 botões com ícone** (2×2 no celular, 4 em linha no desktop), cada um em card branco clicável, grande (mínimo 44px de área de toque, idealmente ~120px de altura), ícone em cima e label embaixo:
   - **Local** (ícone de pin)
   - **Traje** (ícone de camiseta/cabide)
   - **Presente** (ícone de presente)
   - **Confirmar presença** (ícone de check/coração) — este em destaque, com fundo `#5C4433` e texto claro.
8. Rodapé discreto: "Com amor, mamãe e papai".

Animações de entrada sutis (fade + slide-up escalonado), respeitando `prefers-reduced-motion`.

---

## 5. Modais

Todos os modais: overlay escurecido (`rgba(61,43,31,0.45)` com blur leve), card central off-white com cantos arredondados, animação de entrada suave, botão "fechar" (X com `aria-label`), fecha com ESC e ao clicar fora, foco preso dentro do modal enquanto aberto, e no celular pode subir como *bottom sheet*.

### 5.1 Local
- Título: **Local do evento**
- Endereço: **Av. Pedro de Souza Lopes, 4965 — Jardim Cristian Alice**
- Observação em destaque (caixa bege com ícone de alerta suave):
  > **Obs.:** o número 4965 fica em uma pequena descida de estrada de terra da Av. Pedro de Souza Lopes.
- Botão **"Ir para o Google Maps"** abrindo em nova aba: `https://maps.app.goo.gl/Von6z5ij7GrCpaePA?g_st=ic`
- Botão secundário "Copiar endereço" (feedback "Endereço copiado!").

### 5.2 Traje
- Título: **Traje**
- Texto: **Roupas off white, branca, nude ou bege (tons claros).**
- Linha complementar: "Queremos todo mundo combinando com esse momento tão delicado!"
- Mostrar 4 bolinhas de cor ilustrativas (branco, off-white, nude, bege).

### 5.3 Sugestão de presente (lógica importante)
Ao clicar em **Presente**, o convidado recebe **uma** sugestão, mostrada no modal:
> **Sugestão de presente:** Fralda tamanho **{P | M | G | GG}** + um mimo

**Regra de distribuição:**
- Existem 4 tamanhos: **P, M, G, GG**, com uma **cota de 20 sugestões para cada tamanho** (total de 80). A cota deve ser configurável na tabela.
- O tamanho é **sorteado aleatoriamente entre os tamanhos que ainda têm cota disponível**. Assim, a distribuição fica equilibrada (20 P, 20 M, 20 G, 20 GG).
- Quando todas as cotas acabarem, passa a sortear aleatoriamente entre os 4 tamanhos, sem bloquear o convidado.
- O sorteio deve ser **atômico no banco** (função Postgres chamada via RPC, com lock), para que dois convidados clicando ao mesmo tempo não estourem a cota.
- A mesma pessoa não deve ganhar um tamanho novo a cada clique: salve o resultado no `localStorage` (junto com um `visitor_id` gerado com `crypto.randomUUID()`), e na função do banco, se o `visitor_id` já tiver um tamanho atribuído, retorne o mesmo.
- Mostrar uma pequena animação de "sorteio" (os tamanhos girando por ~1s) antes de revelar o resultado. Fica divertido e combina com o tema de revelação.
- Se o convidado confirmar presença depois, o tamanho sorteado também é salvo junto com a confirmação.

### 5.4 Confirmação de presença
Formulário no modal:
- **Nome(s)** — campo de texto multilinha, obrigatório. Texto de ajuda: *"Digite o seu nome e o dos convidados que estarão presentes com você."*
- **Telefone** — obrigatório, com máscara brasileira `(11) 99999-9999`, validando 10 ou 11 dígitos.
- **Quantidade de pessoas** — número, mínimo 1 (pré-preenchido com 1).
- Botão **"Confirmar presença"** com estado de carregamento.

Após salvar: tela de sucesso dentro do modal com o ursinho e a mensagem *"Oba! Sua presença está confirmada. Mal podemos esperar para descobrir com você!"*, mostrando também a sugestão de presente do convidado (se já sorteada; se não, sortear nesse momento).

Validação com **zod** no cliente e **no servidor**. O envio é feito para um Route Handler (`POST /api/rsvp`), que insere no Supabase. Proteção básica contra spam: campo *honeypot* oculto e limite simples de envios por IP (ex.: 5 por hora). Se o mesmo telefone confirmar de novo, atualize o registro em vez de duplicar.

---

## 6. Área da dona do evento `/admin`

- Protegida por senha (`ADMIN_PASSWORD`). Tela de login simples no mesmo visual. Após login, gravar cookie `httpOnly`, `secure`, `sameSite=lax`, assinado com `ADMIN_SESSION_SECRET`, válido por 7 dias. Usar `middleware.ts` para proteger `/admin` e `/api/admin/*`.
- Página com:
  - **Resumo:** total de confirmações, total de pessoas (soma das quantidades) e quantas sugestões de cada tamanho já foram distribuídas vs. cota (ex.: `P 12/20`).
  - **Tabela** dos confirmados: nomes, telefone (com link `https://wa.me/55...` para abrir conversa no WhatsApp), quantidade de pessoas, tamanho de fralda sugerido e data/hora da confirmação. Ordenada da mais recente para a mais antiga, com busca por nome.
  - Botão **"Exportar CSV"**.
  - Botão para excluir uma confirmação (com confirmação antes de excluir).
- Tudo buscado no servidor com a service role key. Layout responsivo: no celular a tabela vira lista de cards.
- Adicionar `noindex` nessa rota.

---

## 7. Banco de dados (Supabase)

Crie uma migração SQL em `supabase/migrations/` com:

```sql
create extension if not exists pgcrypto;

create table public.gift_quotas (
  size text primary key check (size in ('P','M','G','GG')),
  quota int not null default 20,
  assigned int not null default 0
);
insert into public.gift_quotas (size) values ('P'),('M'),('G'),('GG');

create table public.gift_assignments (
  visitor_id uuid primary key,
  size text not null references public.gift_quotas(size),
  created_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  names text not null,
  phone text not null unique,
  guests_count int not null default 1 check (guests_count >= 1),
  gift_size text references public.gift_quotas(size),
  visitor_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gift_quotas      enable row level security;
alter table public.gift_assignments enable row level security;
alter table public.rsvps            enable row level security;
-- Nenhuma policy para anon: todo acesso passa pelo servidor com service role.
```

E a função de sorteio atômico:

```sql
create or replace function public.assign_gift(p_visitor uuid)
returns text language plpgsql security definer as $$
declare v_size text;
begin
  select size into v_size from gift_assignments where visitor_id = p_visitor;
  if v_size is not null then return v_size; end if;

  select size into v_size from gift_quotas
   where assigned < quota
   order by random() limit 1
   for update skip locked;

  if v_size is null then
    select size into v_size from gift_quotas order by random() limit 1;
  end if;

  update gift_quotas set assigned = assigned + 1 where size = v_size;
  insert into gift_assignments(visitor_id, size) values (p_visitor, v_size);
  return v_size;
end $$;
```

O cliente chama `POST /api/gift` com o `visitor_id`, e o servidor executa `supabase.rpc('assign_gift', ...)`.

---

## 8. Detalhes que fazem diferença

- **Pré-visualização no WhatsApp:** metadados Open Graph com título "Chá Revelação — Bernardo ou Maria Júlia?", descrição curta e uma imagem OG (1200×630) gerada com `next/og` no mesmo visual (degradê, ursinho e nomes).
- Favicon com a cabeça do ursinho.
- `lang="pt-BR"`, contraste de texto AA, botões reais (`<button>`, `<a>`), labels associados aos inputs, foco visível em tom marrom.
- Performance: sem bibliotecas pesadas; SVGs inline; Lighthouse mobile acima de 90.
- Testar em telas de 360px, 390px e 430px, e no navegador interno do WhatsApp.

---

## 9. Entregáveis

1. Código completo do projeto com `README.md` explicando: como criar o projeto no Supabase, rodar a migração, configurar as variáveis e fazer o deploy no Render.
2. `render.yaml` e `.env.example`.
3. Migração SQL em `supabase/migrations/`.

**Critérios de aceite:**
- Ao abrir o link, o envelope se abre sozinho, sem clique, de forma fluida no celular; pode ser pulado e respeita `prefers-reduced-motion`.
- Os 4 botões abrem seus modais corretamente no celular.
- O sorteio respeita as cotas de 20 por tamanho e devolve sempre o mesmo tamanho para o mesmo visitante.
- A confirmação é salva no Supabase e aparece imediatamente no `/admin`.
- O `/admin` não é acessível sem senha, e a service role key não aparece em nenhum bundle do cliente.
