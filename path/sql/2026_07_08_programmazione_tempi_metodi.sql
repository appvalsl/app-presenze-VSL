-- ============================================================
-- VSL Operations Workforce - Programmazione + Tempi e Metodi
-- Eseguire in Supabase SQL Editor.
-- ============================================================

alter table public.app_users add column if not exists can_manage_programming boolean not null default false;

create or replace function public.vsl_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active,true) = true
      and (coalesce(au.can_manage_operators,false)=true or upper(coalesce(au.role,'')) in ('ADMIN','SUPERADMIN'))
  );
$$;

create or replace function public.vsl_can_use_programming()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active,true) = true
      and (coalesce(au.can_manage_programming,false)=true or coalesce(au.can_manage_operators,false)=true or upper(coalesce(au.role,'')) in ('ADMIN','SUPERADMIN','PROGRAMMAZIONE','PLANNER','KEY_USER','SUPER_USER','SUPERUSER'))
  );
$$;

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
  unit_time_sec numeric not null default 0,
  production_time_sec numeric not null default 0,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_cycle_times (
  id uuid primary key default gen_random_uuid(),
  articolo text not null,
  test_2 numeric not null default 0,
  fase text,
  lavorazione text,
  tempo_standard_sec numeric not null default 0,
  mod text,
  tempo_sec numeric not null default 0,
  imported_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forms_warehouse_lookup_idx on public.forms_warehouse (upper(coalesce(article_code,'')), upper(coalesce(mod_var,'')), upper(coalesce(mod,'')), upper(coalesce(cod_model,'')));
create index if not exists production_program_daily_rows_date_idx on public.production_program_daily_rows (production_date);
create index if not exists production_program_daily_rows_program_idx on public.production_program_daily_rows (program_id, sort_order);
create index if not exists production_cycle_times_articolo_idx on public.production_cycle_times (upper(articolo));
create index if not exists production_cycle_times_mod_idx on public.production_cycle_times (upper(mod));
create index if not exists production_cycle_times_fase_idx on public.production_cycle_times (upper(coalesce(fase,'')));

create or replace function public.vsl_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_forms_warehouse_updated_at on public.forms_warehouse;
create trigger trg_forms_warehouse_updated_at before update on public.forms_warehouse for each row execute function public.vsl_set_updated_at();
drop trigger if exists trg_production_programs_updated_at on public.production_programs;
create trigger trg_production_programs_updated_at before update on public.production_programs for each row execute function public.vsl_set_updated_at();
drop trigger if exists trg_production_program_daily_rows_updated_at on public.production_program_daily_rows;
create trigger trg_production_program_daily_rows_updated_at before update on public.production_program_daily_rows for each row execute function public.vsl_set_updated_at();
drop trigger if exists trg_production_cycle_times_updated_at on public.production_cycle_times;
create trigger trg_production_cycle_times_updated_at before update on public.production_cycle_times for each row execute function public.vsl_set_updated_at();

alter table public.forms_warehouse enable row level security;
alter table public.production_programs enable row level security;
alter table public.production_program_daily_rows enable row level security;
alter table public.production_cycle_times enable row level security;

-- Drop/recreate policies safely
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('forms_warehouse','production_programs','production_program_daily_rows','production_cycle_times') LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

create policy forms_warehouse_select on public.forms_warehouse for select to authenticated using (public.vsl_can_use_programming());
create policy forms_warehouse_admin_insert on public.forms_warehouse for insert to authenticated with check (public.vsl_is_admin());
create policy forms_warehouse_admin_update on public.forms_warehouse for update to authenticated using (public.vsl_is_admin()) with check (public.vsl_is_admin());
create policy forms_warehouse_admin_delete on public.forms_warehouse for delete to authenticated using (public.vsl_is_admin());

create policy production_programs_select on public.production_programs for select to authenticated using (public.vsl_can_use_programming());
create policy production_programs_insert on public.production_programs for insert to authenticated with check (public.vsl_can_use_programming() and created_by = auth.uid());
create policy production_programs_update on public.production_programs for update to authenticated using (public.vsl_is_admin() or created_by = auth.uid()) with check (public.vsl_can_use_programming());
create policy production_programs_delete on public.production_programs for delete to authenticated using (public.vsl_is_admin());

create policy daily_rows_select on public.production_program_daily_rows for select to authenticated using (public.vsl_can_use_programming());
create policy daily_rows_insert on public.production_program_daily_rows for insert to authenticated with check (public.vsl_can_use_programming() and created_by = auth.uid());
create policy daily_rows_update on public.production_program_daily_rows for update to authenticated using (public.vsl_is_admin() or created_by = auth.uid()) with check (public.vsl_can_use_programming());
create policy daily_rows_delete on public.production_program_daily_rows for delete to authenticated using (public.vsl_is_admin() or created_by = auth.uid());

create policy cycle_times_select on public.production_cycle_times for select to authenticated using (public.vsl_can_use_programming() or public.vsl_is_admin());
create policy cycle_times_admin_insert on public.production_cycle_times for insert to authenticated with check (public.vsl_is_admin());
create policy cycle_times_admin_update on public.production_cycle_times for update to authenticated using (public.vsl_is_admin()) with check (public.vsl_is_admin());
create policy cycle_times_admin_delete on public.production_cycle_times for delete to authenticated using (public.vsl_is_admin());

grant select, insert, update, delete on public.forms_warehouse to authenticated;
grant select, insert, update, delete on public.production_programs to authenticated;
grant select, insert, update, delete on public.production_program_daily_rows to authenticated;
grant select, insert, update, delete on public.production_cycle_times to authenticated;

-- Abilitazione utente esempio:
-- update public.app_users set can_manage_programming = true where lower(email)=lower('nome.cognome@azienda.it');
