-- Cria bucket avatars com políticas RLS adequadas
SELECT storage.create_bucket('avatars', '{"public": true}');

-- Política para permitir usuários autenticados fazerem upload apenas em suas pastas
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir usuários verem seus próprios avatars
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir usuários atualizarem seus próprios avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir usuários deletarem seus próprios avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
