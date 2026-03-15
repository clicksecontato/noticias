-- Remove todos os vídeos da fonte 'ataque-critico' (canal errado UC8CdxtaLc8duS_UjavqAWGw).
-- Os vínculos em youtube_video_games, youtube_video_tags, etc. são removidos em cascata (FK on delete cascade).
-- Execute no SQL Editor do Supabase.

DELETE FROM public.youtube_videos
WHERE source_id = 'ataque-critico';

-- Opcional: conferir quantos foram removidos (rode antes e depois, ou use RETURNING):
-- SELECT COUNT(*) FROM public.youtube_videos WHERE source_id = 'ataque-critico';
