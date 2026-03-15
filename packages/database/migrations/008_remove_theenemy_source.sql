-- 008_remove_theenemy_source.sql
-- The Enemy não existe mais; remove a fonte da lista.

delete from public.sources
where id = 'theenemy';
