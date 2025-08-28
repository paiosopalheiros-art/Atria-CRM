-- Creating avatars bucket with proper RLS policies based on expert recommendations
-- 1) RLS na tabela de perfil
alter table public.user_profiles enable row level security;

-- Policies para user_profiles (se não existirem)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'user_profiles_select_own') then
    create policy "user_profiles_select_own"
    on public.user_profiles for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'user_profiles_insert_own') then
    create policy "user_profiles_insert_own"
    on public.user_profiles for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'user_profiles_update_own') then
    create policy "user_profiles_update_own"
    on public.user_profiles for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

-- Índice para performance
create index if not exists idx_user_profiles_user_id on public.user_profiles (user_id);

-- 2) Criar bucket 'avatars' usando função oficial
select
  case
    when not exists (select 1 from storage.buckets where id = 'avatars')
    then storage.create_bucket('avatars', public => true)
  end;

-- 3) Storage policies para o bucket 'avatars'
do $$
begin
  -- Policy para leitura pública
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'avatars_read_public') then
    create policy "avatars_read_public"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');
  end if;

  -- Policy para upload na própria pasta
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'avatars_insert_own_folder') then
    create policy "avatars_insert_own_folder"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;

  -- Policy para atualizar próprios arquivos
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'avatars_update_own_folder') then
    create policy "avatars_update_own_folder"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = auth.uid()::text
    )
    with check (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;

  -- Policy para deletar próprios arquivos
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'avatars_delete_own_folder') then
    create policy "avatars_delete_own_folder"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;
