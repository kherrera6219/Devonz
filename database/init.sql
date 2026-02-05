-- Initial schema for Devonz
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Example seed data
INSERT INTO users (username, email) VALUES ('admin', 'admin@devonz.local') ON CONFLICT DO NOTHING;
