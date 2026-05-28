CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Article"
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "Article_canonicalUrl_idx"
ON "Article"("canonicalUrl");

CREATE INDEX IF NOT EXISTS "Article_embedding_hnsw_idx"
ON "Article"
USING hnsw ("embedding" vector_cosine_ops);
