-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table blood_tests (
  id bigint generated always as identity primary key,
  test_date date not null,
  marker text not null,
  value numeric not null,
  unit text,
  ref_low numeric,
  ref_high numeric,
  panel_name text,
  notes text,
  created_at timestamptz default now()
);

create table activities (
  id bigint generated always as identity primary key,
  activity_date date not null,
  type text not null,
  duration_min numeric,
  distance_km numeric,
  avg_hr numeric,
  max_hr numeric,
  calories numeric,
  elevation_gain numeric,
  source text default 'Garmin',
  created_at timestamptz default now()
);

create table sleep (
  id bigint generated always as identity primary key,
  sleep_date date not null,
  duration_min numeric,
  deep_min numeric,
  light_min numeric,
  rem_min numeric,
  awake_min numeric,
  score numeric,
  source text default 'Garmin',
  created_at timestamptz default now()
);

create table body_metrics (
  id bigint generated always as identity primary key,
  metric_date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  source text default 'Manual',
  created_at timestamptz default now()
);

-- Row Level Security: locked down by default, opened only to requests
-- carrying your anon key (which only you have). This is fine for a
-- single-user personal app; do not share your anon key publicly.
alter table blood_tests enable row level security;
alter table activities enable row level security;
alter table sleep enable row level security;
alter table body_metrics enable row level security;

create policy "allow all with anon key" on blood_tests for all using (true) with check (true);
create policy "allow all with anon key" on activities for all using (true) with check (true);
create policy "allow all with anon key" on sleep for all using (true) with check (true);
create policy "allow all with anon key" on body_metrics for all using (true) with check (true);

-- Storage bucket for original lab report PDFs.
-- Create via Storage tab in the dashboard: bucket name "lab-reports", private.
