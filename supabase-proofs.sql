-- Migration: quest_proofs (applied 2026-09-08 to project afxsoxexfahehhjijzlr)
--
-- Photo proof for scavenger-hunt claims. Earlier migrations are recorded in
-- supabase-setup.sql and supabase-chat.sql.

-- 1. Where the URL is recorded. Nullable: claims made before this migration,
--    and the other kinds sharing quest_claims (race, pack), have no proof.
alter table public.quest_claims add column if not exists proof_url text;

-- 2. A public bucket for the photos. 5 MB ceiling, images only; the client
--    downscales to ~1280px before uploading so real files are well under that.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs','proofs', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public=excluded.public,
      file_size_limit=excluded.file_size_limit,
      allowed_mime_types=excluded.allowed_mime_types;

-- 3. Anon may upload into the bucket and read it back. No update, no delete —
--    same append-only posture as reactions / chat_messages, so a photo cannot be
--    swapped out or wiped once it is someone's proof. (A public bucket also
--    serves reads through /object/public/... without touching these policies.)
--    storage.objects already carries the table-level grants for anon, so unlike
--    a fresh table in public these policies are all that is needed.
drop policy if exists "proofs insert for all" on storage.objects;
create policy "proofs insert for all" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'proofs');

drop policy if exists "proofs read for all" on storage.objects;
create policy "proofs read for all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'proofs');
