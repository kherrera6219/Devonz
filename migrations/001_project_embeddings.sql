CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS project_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metadata jsonb,
    embedding vector(1536)
);
CREATE INDEX IF NOT EXISTS embedding_idx ON project_embeddings USING hnsw (embedding vector_cosine_ops);
