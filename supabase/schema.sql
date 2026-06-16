create extension if not exists pgcrypto;

create table if not exists production_lines (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stations (
  id uuid primary key default gen_random_uuid(),
  line_name text not null references production_lines(name) on update cascade on delete cascade,
  station_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(line_name, station_name)
);

create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  stabilimento text,
  cognome text not null,
  nome text not null,
  idOperatore text not null,
  idCdc text,
  lineaProduzione text not null references production_lines(name) on update cascade,
  macroLineaProduzione text,
  postazione text,
  oreStandard numeric(6,2) not null default 8,
  created_at timestamptz not null default now(),
  unique(idOperatore, lineaProduzione)
);

create table if not exists attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  line_name text not null references production_lines(name) on update cascade,
  start_time text not null,
  end_time text not null,
  lunch_min integer not null default 0,
  snack_min integer not null default 0,
  stops_min integer not null default 0,
  stops_note text,
  base_work_minutes integer not null default 0,
  base_net_minutes integer not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(work_date, line_name)
);

create table if not exists attendance_rows (
  id uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references attendance_sessions(id) on delete cascade,
  operator_id uuid references operators(id) on delete set null,
  sort_order integer not null default 0,
  stabilimento text,
  cognome text not null,
  nome text not null,
  id_operatore text not null,
  id_cdc text,
  macro_linea_produzione text,
  line_orig text,
  line_day text not null,
  postazione text,
  ore_standard numeric(6,2) not null default 8,
  work_min integer not null default 0,
  evento_min integer not null default 0,
  assemblea_min integer not null default 0,
  sciopero_min integer not null default 0,
  final_min integer not null default 0,
  dirty boolean not null default false,
  removed boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_attendance_sessions_updated_at on attendance_sessions;
create trigger trg_attendance_sessions_updated_at before update on attendance_sessions for each row execute function set_updated_at();

alter table production_lines enable row level security;
alter table stations enable row level security;
alter table operators enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_rows enable row level security;

drop policy if exists authenticated_read_production_lines on production_lines;
create policy authenticated_read_production_lines on production_lines for select to authenticated using (true);
drop policy if exists authenticated_read_stations on stations;
create policy authenticated_read_stations on stations for select to authenticated using (true);
drop policy if exists authenticated_read_operators on operators;
create policy authenticated_read_operators on operators for select to authenticated using (true);
drop policy if exists authenticated_read_attendance_sessions on attendance_sessions;
create policy authenticated_read_attendance_sessions on attendance_sessions for select to authenticated using (true);
drop policy if exists authenticated_insert_attendance_sessions on attendance_sessions;
create policy authenticated_insert_attendance_sessions on attendance_sessions for insert to authenticated with check (true);
drop policy if exists authenticated_update_attendance_sessions on attendance_sessions;
create policy authenticated_update_attendance_sessions on attendance_sessions for update to authenticated using (true) with check (true);
drop policy if exists authenticated_delete_attendance_sessions on attendance_sessions;
create policy authenticated_delete_attendance_sessions on attendance_sessions for delete to authenticated using (true);
drop policy if exists authenticated_read_attendance_rows on attendance_rows;
create policy authenticated_read_attendance_rows on attendance_rows for select to authenticated using (true);
drop policy if exists authenticated_insert_attendance_rows on attendance_rows;
create policy authenticated_insert_attendance_rows on attendance_rows for insert to authenticated with check (true);
drop policy if exists authenticated_update_attendance_rows on attendance_rows;
create policy authenticated_update_attendance_rows on attendance_rows for update to authenticated using (true) with check (true);
drop policy if exists authenticated_delete_attendance_rows on attendance_rows;
create policy authenticated_delete_attendance_rows on attendance_rows for delete to authenticated using (true);
