-- AddColumn: isFavorite to Movie
ALTER TABLE "Movie"
ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;
