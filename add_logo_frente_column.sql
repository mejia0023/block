-- Migración: Agregar columna logo_frente a candidatos
-- Fecha: 2026-04-26

ALTER TABLE candidatos 
ADD COLUMN IF NOT EXISTS logo_frente TEXT;

-- Verificar que se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND column_name = 'logo_frente';
