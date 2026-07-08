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
