-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- Creates the table + RLS policies for the share feature, plus the storage bucket
-- (with a size/mime allowlist) and its own access policies, in one shot.

create table if not exists public.shared_tabs (
  id text primary key,
  image_url text not null,
  image_width integer not null,
  image_height integer not null,
  annotations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shared_tabs enable row level security;

create policy "public can read shared tabs" on public.shared_tabs
  for select using (true);

create policy "public can insert shared tabs" on public.shared_tabs
  for insert with check (
    image_url like 'https://%/storage/v1/object/public/shared-screenshots/%'
    and jsonb_array_length(annotations) <= 200
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shared-screenshots', 'shared-screenshots', true, 15728640,
        array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','image/bmp'])
on conflict (id) do nothing;

create policy "public can read shared screenshots" on storage.objects
  for select using (bucket_id = 'shared-screenshots');

create policy "public can upload shared screenshots" on storage.objects
  for insert with check (bucket_id = 'shared-screenshots');
