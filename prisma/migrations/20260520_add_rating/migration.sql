-- AddColumn: rating to Movie (Postgres)
ALTER TABLE "Movie"
ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 0;
