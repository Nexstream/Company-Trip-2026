-- Migration: quest_proofs (applied 2026-09-08 to project afxsoxexfahehhjijzlr)
--
-- Photo proof for scavenger-hunt claims. Earlier migrations are recorded in
-- supabase-setup.sql and supabase-chat.sql.

-- 1. Where the object path is recorded. Nullable: claims made before this
--    migration, and the other kinds sharing quest_claims (race, pack), have
--    no proof. A path, not a URL — the bucket is private (see 2).
alter table public.quest_claims add column if not exists proof_path text;

-- 2. A private bucket for the photos. 5 MB ceiling, images only; the client
--    downscales to ~1280px before uploading so real files are well under that.
--    Private because the anon key is public (the repo is public), so a proof
--    URL that gets forwarded, scraped or indexed would otherwise stay
--    fetchable forever. Reads go through 1-hour signed URLs minted by the
--    client at render time. This is not a hard boundary against someone
--    holding the anon key — only real auth would be — but it closes the
--    accidental-leak path at no cost to the join flow.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs','proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public=excluded.public,
      file_size_limit=excluded.file_size_limit,
      allowed_mime_types=excluded.allowed_mime_types;

-- 3. Anon may upload into the bucket and read it back. No update, no delete —
--    same append-only posture as reactions / chat_messages, so a photo cannot be
--    swapped out or wiped once it is someone's proof. The select policy is also
--    what lets anon mint a signed URL for a private object.
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

-- ---------------------------------------------------------------------------
-- Migration: quest_claims_position (applied 2026-09-08)
--
-- Where a claim was made. Hunt claims are gated on a live GPS fix inside Japan,
-- and this records the fix that let it through, so a claim is auditable after
-- the fact rather than the check living only in the client.
-- Nullable: race and pack rows, and every claim made before this, have none.
alter table public.quest_claims add column if not exists lat double precision;
alter table public.quest_claims add column if not exists lng double precision;
