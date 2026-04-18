-- Expand imageUrl column to support Base64 encoded images
ALTER TABLE resources 
ALTER COLUMN image_url TYPE TEXT;
