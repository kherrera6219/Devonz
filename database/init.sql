-- Initial schema for Devonz
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    project_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for project-based embeddings with project isolation and hybrid search support
CREATE TABLE IF NOT EXISTS project_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    content TEXT,
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GIN index for hybrid/lexical search on content
CREATE INDEX IF NOT EXISTS idx_project_embeddings_content_gin ON project_embeddings USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_project_embeddings_project_id ON project_embeddings (project_id);

-- Example seed data
INSERT INTO users (username, email, project_id)
VALUES ('admin', 'admin@devonz.local', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;
