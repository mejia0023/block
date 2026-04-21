-- FICCT E-Voting — Schema
-- Run: psql -h localhost -U postgres -d ficct_evoting_db -f ficct_evoting_db.sql

-- Extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMs ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE career_type AS ENUM ('SISTEMAS', 'INFORMATICA', 'REDES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('ESTUDIANTE', 'DOCENTE', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE position_type AS ENUM (
    'DECANO', 'DIRECTOR_SISTEMAS', 'DIRECTOR_INFORMATICA', 'DIRECTOR_REDES'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE election_status AS ENUM (
    'PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ru            VARCHAR(50)  UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  career        career_type  NOT NULL,
  role          role_type    NOT NULL,
  is_enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
  has_voted     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS elections (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255)   NOT NULL,
  description TEXT,
  start_date  TIMESTAMPTZ    NOT NULL,
  end_date    TIMESTAMPTZ    NOT NULL,
  status      election_status NOT NULL DEFAULT 'PROGRAMADA',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_dates CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS candidates (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id    UUID          NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  front_name     VARCHAR(100)  NOT NULL,
  candidate_name VARCHAR(255)  NOT NULL,
  position       position_type NOT NULL,
  photo_url      TEXT,
  mission        TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockchain_sync_logs (
  id           SERIAL      PRIMARY KEY,
  user_id      UUID        REFERENCES users(id),
  election_id  UUID        REFERENCES elections(id),
  tx_id        TEXT        UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_logs_election       ON blockchain_sync_logs(election_id);
CREATE INDEX IF NOT EXISTS idx_logs_status         ON blockchain_sync_logs(status);
