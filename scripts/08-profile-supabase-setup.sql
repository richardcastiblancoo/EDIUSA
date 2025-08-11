-- Asegurar columnas en tabla users
alter table public.users
  add column if not exists avatar text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists document_number text;

-- Tabla de imágenes de usuario
create table if not exists public.user_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_type text not null check (image_type in ('avatar','logo','banner')),
  image_url text not null,
  original_filename text,
  file_size bigint,
  mime_type text,
  uploaded_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index if not exists idx_user_images_user_type_active
  on public.user_images(user_id, image_type, is_active);

-- RLS para user_images
alter table public.user_images enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'user_images_select_own') then
    create policy user_images_select_own on public.user_images
      for select using (auth.uid()::text = user_id::text);
  end if;

  if not exists (select 1 from pg_policies where polname = 'user_images_insert_own') then
    create policy user_images_insert_own on public.user_images
      for insert with check (auth.uid()::text = user_id::text);
  end if;

  if not exists (select 1 from pg_policies where polname = 'user_images_update_own') then
    create policy user_images_update_own on public.user_images
      for update using (auth.uid()::text = user_id::text);
  end if;
end$$;

-- Tabla de ajustes de usuario
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  exam_reminders boolean not null default true,
  grade_notifications boolean not null default true,
  theme text not null default 'light',
  language text not null default 'es',
  timezone text not null default 'America/Bogota',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS para user_settings
alter table public.user_settings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'user_settings_select_own') then
    create policy user_settings_select_own on public.user_settings
      for select using (auth.uid()::text = user_id::text);
  end if;

  if not exists (select 1 from pg_policies where polname = 'user_settings_upsert_own') then
    create policy user_settings_upsert_own on public.user_settings
      for all using (auth.uid()::text = user_id::text) with check (auth.uid()::text = user_id::text);
  end if;
end$$;