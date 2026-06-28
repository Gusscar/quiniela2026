-- =============================================
-- QUINIELA MUNDIAL 2026 - Schema
-- Correr en: SQL Editor del nuevo proyecto Supabase
-- =============================================

-- Perfiles de usuario
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  payment_status text default 'pending' check (payment_status in ('paid', 'pending')),
  created_at timestamptz default now()
);

-- Admins
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade
);

-- Equipos
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_letter text,
  flag_url text,
  description text,
  created_at timestamptz default now()
);

-- Partidos
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  teama_id uuid references public.teams(id),
  teamb_id uuid references public.teams(id),
  datetime timestamptz,
  group_letter text,
  status text default 'scheduled' check (status in ('scheduled', 'pending', 'live', 'finished')),
  scorea integer,
  scoreb integer,
  created_at timestamptz default now()
);

-- Predicciones
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  goalsa integer not null check (goalsa >= 0),
  goalsb integer not null check (goalsb >= 0),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  created_at timestamptz default now()
);

-- =============================================
-- RLS
-- =============================================

alter table public.user_profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.push_subscriptions enable row level security;

-- user_profiles
create policy "usuarios ven perfiles" on public.user_profiles for select using (true);
create policy "usuario edita su perfil" on public.user_profiles for update using (auth.uid() = id);
create policy "usuario inserta su perfil" on public.user_profiles for insert with check (auth.uid() = id);

-- admin_users
create policy "admins ven admins" on public.admin_users for select using (true);

-- teams
create policy "todos ven equipos" on public.teams for select using (true);

-- matches
create policy "todos ven partidos" on public.matches for select using (true);

-- predictions
create policy "usuario ve sus predicciones" on public.predictions for select using (auth.uid() = user_id);
create policy "usuario inserta sus predicciones" on public.predictions for insert with check (auth.uid() = user_id);
create policy "usuario actualiza sus predicciones" on public.predictions for update using (auth.uid() = user_id);

-- push_subscriptions
create policy "usuario ve sus suscripciones" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "usuario inserta suscripcion" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "usuario borra suscripcion" on public.push_subscriptions for delete using (auth.uid() = user_id);
