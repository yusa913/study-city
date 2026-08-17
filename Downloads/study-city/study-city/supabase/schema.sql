-- ============================================================
-- 勉強記録×街づくりアプリ MVP スキーマ
-- Supabase (PostgreSQL) 用
-- Supabaseダッシュボードの SQL Editor にそのまま貼り付けて実行してください
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. profiles: auth.users の付随情報
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 2. slots: 科目スロット（A〜F、ラベル自由入力）
-- ------------------------------------------------------------
create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position text not null check (position in ('A','B','C','D','E','F')),
  label text not null,
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

alter table public.slots enable row level security;

create policy "slots_select_own" on public.slots
  for select using (auth.uid() = user_id);
create policy "slots_insert_own" on public.slots
  for insert with check (auth.uid() = user_id);
create policy "slots_update_own" on public.slots
  for update using (auth.uid() = user_id);
create policy "slots_delete_own" on public.slots
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. study_records: 時間記録ログ
-- ------------------------------------------------------------
create table if not exists public.study_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete cascade,
  minutes integer not null check (minutes > 0 and minutes <= 600),
  recorded_on date not null default (timezone('utc', now()))::date,
  common_gain numeric not null default 0,
  dedicated_gain numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_records_user_date_idx
  on public.study_records (user_id, recorded_on);

alter table public.study_records enable row level security;

create policy "records_select_own" on public.study_records
  for select using (auth.uid() = user_id);
create policy "records_insert_own" on public.study_records
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. materials: 共通資材（進行度用）／専用資材（装飾用）の二層構造
-- ------------------------------------------------------------
create table if not exists public.material_common (
  user_id uuid primary key references auth.users(id) on delete cascade,
  amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.material_common enable row level security;

create policy "material_common_select_own" on public.material_common
  for select using (auth.uid() = user_id);
create policy "material_common_upsert_own" on public.material_common
  for insert with check (auth.uid() = user_id);
create policy "material_common_update_own" on public.material_common
  for update using (auth.uid() = user_id);

create table if not exists public.material_dedicated (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_position text not null check (slot_position in ('A','B','C','D','E','F')),
  amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot_position)
);

alter table public.material_dedicated enable row level security;

create policy "material_dedicated_select_own" on public.material_dedicated
  for select using (auth.uid() = user_id);
create policy "material_dedicated_upsert_own" on public.material_dedicated
  for insert with check (auth.uid() = user_id);
create policy "material_dedicated_update_own" on public.material_dedicated
  for update using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. buildings: 建物（棟）。ユーザーごとに 1棟目, 2棟目... と連番
-- ------------------------------------------------------------
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  building_index integer not null,
  stage integer not null default 0 check (stage between 0 and 3), -- 0:土台 1:骨組み 2:外装 3:完成
  common_invested numeric not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, building_index)
);

create index if not exists buildings_user_idx on public.buildings (user_id, building_index);

alter table public.buildings enable row level security;

create policy "buildings_select_own" on public.buildings
  for select using (auth.uid() = user_id);
create policy "buildings_insert_own" on public.buildings
  for insert with check (auth.uid() = user_id);
create policy "buildings_update_own" on public.buildings
  for update using (auth.uid() = user_id);

-- 各棟がどのスロット(専用資材)をどれだけ使って装飾されたか（内訳 = decorationSet）
create table if not exists public.building_decorations (
  building_id uuid not null references public.buildings(id) on delete cascade,
  slot_position text not null check (slot_position in ('A','B','C','D','E','F')),
  amount numeric not null default 0,
  primary key (building_id, slot_position)
);

alter table public.building_decorations enable row level security;

create policy "building_decorations_select_own" on public.building_decorations
  for select using (
    exists (
      select 1 from public.buildings b
      where b.id = building_decorations.building_id and b.user_id = auth.uid()
    )
  );
create policy "building_decorations_insert_own" on public.building_decorations
  for insert with check (
    exists (
      select 1 from public.buildings b
      where b.id = building_decorations.building_id and b.user_id = auth.uid()
    )
  );
create policy "building_decorations_update_own" on public.building_decorations
  for update using (
    exists (
      select 1 from public.buildings b
      where b.id = building_decorations.building_id and b.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 6. follows: フォロー/フォロワー（MVP後のフェーズだが器だけ用意）
-- ------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "follows_select_related" on public.follows
  for select using (auth.uid() = follower_id or auth.uid() = followee_id);
create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- 7. 新規ユーザー登録時に profiles / material_common を自動作成
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.material_common (user_id, amount)
  values (new.id, 0);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
