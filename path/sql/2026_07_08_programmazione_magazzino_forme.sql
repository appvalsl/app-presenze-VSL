-- ============================================================
-- VSL Operations Workforce - Programmazione manovie + Magazzino Forme
-- Eseguire in Supabase SQL Editor prima di usare la nuova sezione.
-- ============================================================

-- 1) Permesso applicativo per abilitare solo gli utenti scelti da admin
alter table public.app_users
  add column if not exists can_manage_programming boolean not null default false;

comment on column public.app_users.can_manage_programming is
  'Se true abilita l utente alla sezione PROGRAMMAZIONE produzione manovie.';

-- 2) Funzioni helper per RLS
create or replace function public.vsl_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active, true) = true
      and (
        coalesce(au.can_manage_operators, false) = true
        or upper(coalesce(au.role, '')) in ('ADMIN', 'SUPERADMIN')
      )
  );
$$;

create or replace function public.vsl_can_use_programming()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active, true) = true
      and (
        coalesce(au.can_manage_programming, false) = true
        or coalesce(au.can_manage_operators, false) = true
        or upper(coalesce(au.role, '')) in ('ADMIN', 'SUPERADMIN', 'PROGRAMMAZIONE', 'PLANNER', 'KEY_USER', 'SUPER_USER')
      )
  );
$$;

-- 3) Magazzino forme importabile da Excel
create table if not exists public.forms_warehouse (
  id uuid primary key default gen_random_uuid(),
  article_code text,
  mod_var text,
  mod text,
  cod_model text,
  model_forma text,
  description_forma text,
  size_quantities jsonb not null default '{}'::jsonb,
  total_qty numeric not null default 0,
  caubi_codubi text,
  catub_descri text,
  imported_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists forms_warehouse_lookup_unique
  on public.forms_warehouse (cod_model, mod_var, model_forma, caubi_codubi) nulls not distinct;

create index if not exists forms_warehouse_article_idx on public.forms_warehouse (upper(coalesce(article_code, '')));
create index if not exists forms_warehouse_mod_var_idx on public.forms_warehouse (upper(coalesce(mod_var, '')));
create index if not exists forms_warehouse_mod_idx on public.forms_warehouse (upper(coalesce(mod, '')));
create index if not exists forms_warehouse_cod_model_idx on public.forms_warehouse (upper(coalesce(cod_model, '')));
create index if not exists forms_warehouse_model_forma_idx on public.forms_warehouse (upper(coalesce(model_forma, '')));

-- 4) Testata programma produzione
create table if not exists public.production_programs (
  id uuid primary key default gen_random_uuid(),
  title text,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_programs_dates_check check (end_date >= start_date)
);

create index if not exists production_programs_period_idx on public.production_programs (start_date, end_date);
create index if not exists production_programs_created_by_idx on public.production_programs (created_by);

-- 5) Righe programma: quantità giornaliere in JSONB per mantenere periodo dinamico
create table if not exists public.production_program_items (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.production_programs(id) on delete cascade,
  sort_order integer not null default 0,
  line_name text not null,
  lookup_code text,
  article_code text,
  form_code text,
  form_qty numeric not null default 0,
  quantities_by_date jsonb not null default '{}'::jsonb,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_program_items_program_idx on public.production_program_items (program_id, sort_order);
create index if not exists production_program_items_line_idx on public.production_program_items (line_name);
create index if not exists production_program_items_article_idx on public.production_program_items (upper(coalesce(article_code, '')));
create index if not exists production_program_items_form_idx on public.production_program_items (upper(coalesce(form_code, '')));

-- 6) Trigger updated_at
create or replace function public.vsl_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_forms_warehouse_updated_at on public.forms_warehouse;
create trigger trg_forms_warehouse_updated_at
before update on public.forms_warehouse
for each row execute function public.vsl_set_updated_at();

drop trigger if exists trg_production_programs_updated_at on public.production_programs;
create trigger trg_production_programs_updated_at
before update on public.production_programs
for each row execute function public.vsl_set_updated_at();

drop trigger if exists trg_production_program_items_updated_at on public.production_program_items;
create trigger trg_production_program_items_updated_at
before update on public.production_program_items
for each row execute function public.vsl_set_updated_at();

-- 7) RLS: admin importa magazzino, utenti abilitati leggono e creano programmi
alter table public.forms_warehouse enable row level security;
alter table public.production_programs enable row level security;
alter table public.production_program_items enable row level security;

drop policy if exists forms_warehouse_select_programming on public.forms_warehouse;
create policy forms_warehouse_select_programming
on public.forms_warehouse
for select
to authenticated
using (public.vsl_can_use_programming());

drop policy if exists forms_warehouse_admin_insert on public.forms_warehouse;
create policy forms_warehouse_admin_insert
on public.forms_warehouse
for insert
to authenticated
with check (public.vsl_is_admin());

drop policy if exists forms_warehouse_admin_update on public.forms_warehouse;
create policy forms_warehouse_admin_update
on public.forms_warehouse
for update
to authenticated
using (public.vsl_is_admin())
with check (public.vsl_is_admin());

drop policy if exists forms_warehouse_admin_delete on public.forms_warehouse;
create policy forms_warehouse_admin_delete
on public.forms_warehouse
for delete
to authenticated
using (public.vsl_is_admin());

drop policy if exists production_programs_select_programming on public.production_programs;
create policy production_programs_select_programming
on public.production_programs
for select
to authenticated
using (public.vsl_can_use_programming());

drop policy if exists production_programs_insert_programming on public.production_programs;
create policy production_programs_insert_programming
on public.production_programs
for insert
to authenticated
with check (public.vsl_can_use_programming() and created_by = auth.uid());

drop policy if exists production_programs_update_programming on public.production_programs;
create policy production_programs_update_programming
on public.production_programs
for update
to authenticated
using (public.vsl_is_admin() or created_by = auth.uid())
with check (public.vsl_can_use_programming());

drop policy if exists production_programs_delete_admin on public.production_programs;
create policy production_programs_delete_admin
on public.production_programs
for delete
to authenticated
using (public.vsl_is_admin());

drop policy if exists production_program_items_select_programming on public.production_program_items;
create policy production_program_items_select_programming
on public.production_program_items
for select
to authenticated
using (public.vsl_can_use_programming());

drop policy if exists production_program_items_insert_programming on public.production_program_items;
create policy production_program_items_insert_programming
on public.production_program_items
for insert
to authenticated
with check (public.vsl_can_use_programming() and created_by = auth.uid());

drop policy if exists production_program_items_update_programming on public.production_program_items;
create policy production_program_items_update_programming
on public.production_program_items
for update
to authenticated
using (
  public.vsl_is_admin()
  or created_by = auth.uid()
  or exists (
    select 1 from public.production_programs p
    where p.id = production_program_items.program_id
      and p.created_by = auth.uid()
  )
)
with check (public.vsl_can_use_programming());

drop policy if exists production_program_items_delete_admin on public.production_program_items;
create policy production_program_items_delete_admin
on public.production_program_items
for delete
to authenticated
using (public.vsl_is_admin());

grant select, insert, update, delete on public.forms_warehouse to authenticated;
grant select, insert, update, delete on public.production_programs to authenticated;
grant select, insert, update, delete on public.production_program_items to authenticated;

-- 8) Esempi abilitazione utenti
-- Sostituisci email con l utente da abilitare:
-- update public.app_users set can_manage_programming = true where lower(email) = lower('nome.cognome@azienda.it');
-- Per togliere accesso:
-- update public.app_users set can_manage_programming = false where lower(email) = lower('nome.cognome@azienda.it');


-- ============================================================
-- ADDENDUM V3: formato giornaliero DATA/CODICI/QUANTITA
-- ============================================================
-- ============================================================
-- VSL Operations Workforce - Programmazione V3 formato giornaliero
-- Eseguire se hai gia installato la Programmazione V1/V2.
-- Salva il programma nel formato: DATA, CODICI, QUANTITA.
-- ============================================================

create table if not exists public.production_program_daily_rows (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.production_programs(id) on delete cascade,
  program_title text,
  production_date date not null,
  sort_order integer not null default 0,
  line_name text not null,
  lookup_code text,
  article_code text,
  form_code text,
  form_qty numeric not null default 0,
  quantity numeric not null default 0,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_program_daily_rows_date_idx on public.production_program_daily_rows (production_date);
create index if not exists production_program_daily_rows_line_idx on public.production_program_daily_rows (line_name);
create index if not exists production_program_daily_rows_program_idx on public.production_program_daily_rows (program_id, sort_order);
create index if not exists production_program_daily_rows_article_idx on public.production_program_daily_rows (upper(coalesce(article_code, '')));
create index if not exists production_program_daily_rows_form_idx on public.production_program_daily_rows (upper(coalesce(form_code, '')));

create or replace function public.vsl_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_production_program_daily_rows_updated_at on public.production_program_daily_rows;
create trigger trg_production_program_daily_rows_updated_at
before update on public.production_program_daily_rows
for each row execute function public.vsl_set_updated_at();

alter table public.production_program_daily_rows enable row level security;

drop policy if exists production_program_daily_rows_select_programming on public.production_program_daily_rows;
create policy production_program_daily_rows_select_programming
on public.production_program_daily_rows
for select
to authenticated
using (public.vsl_can_use_programming());

drop policy if exists production_program_daily_rows_insert_programming on public.production_program_daily_rows;
create policy production_program_daily_rows_insert_programming
on public.production_program_daily_rows
for insert
to authenticated
with check (public.vsl_can_use_programming() and created_by = auth.uid());

drop policy if exists production_program_daily_rows_update_programming on public.production_program_daily_rows;
create policy production_program_daily_rows_update_programming
on public.production_program_daily_rows
for update
to authenticated
using (
  public.vsl_is_admin()
  or created_by = auth.uid()
  or exists (
    select 1 from public.production_programs p
    where p.id = production_program_daily_rows.program_id
      and p.created_by = auth.uid()
  )
)
with check (public.vsl_can_use_programming());

drop policy if exists production_program_daily_rows_delete_admin on public.production_program_daily_rows;
create policy production_program_daily_rows_delete_admin
on public.production_program_daily_rows
for delete
to authenticated
using (public.vsl_is_admin());

grant select, insert, update, delete on public.production_program_daily_rows to authenticated;
