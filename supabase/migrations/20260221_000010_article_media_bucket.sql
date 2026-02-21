-- Storage bucket for article thumbnails and cover images.
-- Public read is allowed; writes are server-side only through service-role APIs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-media',
  'article-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists article_media_public_read on storage.objects;
create policy article_media_public_read
  on storage.objects
  for select
  using (bucket_id = 'article-media');

drop policy if exists article_media_insert_none on storage.objects;
create policy article_media_insert_none
  on storage.objects
  for insert
  with check (false);

drop policy if exists article_media_update_none on storage.objects;
create policy article_media_update_none
  on storage.objects
  for update
  using (false)
  with check (false);

drop policy if exists article_media_delete_none on storage.objects;
create policy article_media_delete_none
  on storage.objects
  for delete
  using (false);
