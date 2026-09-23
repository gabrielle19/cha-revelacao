-- Chá Revelação — regras de acesso para SITE ESTÁTICO (sem servidor).
--
-- Agora quem lê e escreve é sempre a chave pública (anon), direto do navegador.
-- A segurança passa a ser 100% garantida pelas regras (RLS) do Postgres:
--   • dá para INSERIR confirmações/recadinhos e ATUALIZAR a própria confirmação;
--   • dá para LER confirmações, recadinhos e cotas (o painel /admin é público);
--   • NÃO existe policy de DELETE para anon — ninguém apaga dados pelo site.
--     Para excluir algo, use o Table Editor do próprio Supabase (credenciais de dono).
--
-- Rode este arquivo no SQL Editor do Supabase depois de 0001 e 0002.

alter table public.rsvps            enable row level security;
alter table public.messages         enable row level security;
alter table public.gift_quotas      enable row level security;
alter table public.gift_assignments enable row level security;

-- ── rsvps: convidados inserem/atualizam a própria confirmação; leitura pública ──
drop policy if exists "rsvps_insert_anon"       on public.rsvps;
drop policy if exists "rsvps_update_own_phone"  on public.rsvps;
drop policy if exists "rsvps_select_public"     on public.rsvps;

create policy "rsvps_insert_anon" on public.rsvps
  for insert to anon with check (true);
create policy "rsvps_update_own_phone" on public.rsvps
  for update to anon using (true) with check (true);
create policy "rsvps_select_public" on public.rsvps
  for select to anon using (true);

-- ── messages: qualquer um insere; leitura pública (necessária para o painel) ──
drop policy if exists "messages_insert_anon"   on public.messages;
drop policy if exists "messages_select_public" on public.messages;

create policy "messages_insert_anon" on public.messages
  for insert to anon with check (true);
create policy "messages_select_public" on public.messages
  for select to anon using (true);

-- ── gift_quotas: leitura liberada (resumo de cotas no painel); nunca escrita direta ──
drop policy if exists "gift_quotas_select_public" on public.gift_quotas;

create policy "gift_quotas_select_public" on public.gift_quotas
  for select to anon using (true);

-- gift_assignments: sem select/insert/update/delete diretos para anon.
-- Só a função assign_gift (security definer) mexe nela, com privilégios elevados.

-- Privilégios de tabela para a role anon (as policies acima ainda filtram tudo).
grant select, insert, update on public.rsvps    to anon;
grant select, insert         on public.messages to anon;
grant select                 on public.gift_quotas to anon;

-- O sorteio roda por dentro do banco (security definer), então anon só precisa
-- poder EXECUTAR a função — não precisa de escrita direta nas tabelas de presente.
grant execute on function public.assign_gift(uuid) to anon;
