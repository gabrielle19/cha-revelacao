-- Mural de recadinhos para o bebê (privado — só o painel lê, via service role).

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 400),
  visitor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

alter table public.messages enable row level security;
-- Sem policies para anon: leitura e escrita só pelo servidor com a service role key.
