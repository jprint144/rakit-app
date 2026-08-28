-- Avatar akun Rakit: satu folder per user, hanya pemilik yang dapat mengubah filenya.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Avatar dapat dibaca publik"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "User dapat mengunggah avatar sendiri"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "User dapat memperbarui avatar sendiri"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
