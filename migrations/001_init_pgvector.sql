CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS resume_chunks (
  source_id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  role TEXT,
  years TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  snippet TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX IF NOT EXISTS resume_chunks_embedding_idx
ON resume_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
