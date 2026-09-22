-- Chá Revelação — esquema inicial
-- Todo acesso a estas tabelas passa pelo servidor usando a service role key.

create extension if not exists pgcrypto;

-- Cotas de sugestão de presente por tamanho de fralda
create table if not exists public.gift_quotas (
  size text primary key check (size in ('P','M','G','GG')),
  quota int not null default 20,
  assigned int not null default 0
);

insert into public.gift_quotas (size) values ('P'),('M'),('G'),('GG')
  on conflict (size) do nothing;

-- Tamanho atribuído a cada visitante (idempotente por visitor_id)
create table if not exists public.gift_assignments (
  visitor_id uuid primary key,
  size text not null references public.gift_quotas(size),
  created_at timestamptz not null default now()
);

-- Confirmações de presença
create table if not exists public.rsvps (
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

-- Sorteio atômico de tamanho de presente.
-- Se o visitante já tiver um tamanho, devolve o mesmo (idempotente).
-- Caso contrário, sorteia entre os tamanhos com cota disponível (lock por linha),
-- e quando todas as cotas acabam, sorteia livremente entre os 4 tamanhos.
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
  insert into gift_assignments(visitor_id, size) values (p_visitor, v_size)
    on conflict (visitor_id) do nothing;
  return v_size;
end $$;
