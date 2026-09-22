DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'registrations'
  ) THEN
    CREATE TABLE registrations (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      ticket_id VARCHAR(32) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      study_level VARCHAR(100),
      graduation_year VARCHAR(20),
      attendance_mode VARCHAR(20) NOT NULL,
      quantum_experience VARCHAR(50) NOT NULL,
      interests TEXT[] NOT NULL DEFAULT '{}',
      github_url TEXT,
      linkedin_url TEXT,
      tshirt_size VARCHAR(50) NOT NULL,
      referral_code VARCHAR(20) UNIQUE,
      referred_by VARCHAR(20),
      referral_count INTEGER NOT NULL DEFAULT 0,
      agreed_to_terms BOOLEAN NOT NULL DEFAULT TRUE,
      willing_to_be_poc BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20),
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS willing_to_be_poc BOOLEAN NOT NULL DEFAULT FALSE;

-- Index on lowercase email to enforce single registration per person
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_lower ON registrations (LOWER(email));

-- Index on referral_code for shareable referral lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_referral_code ON registrations (referral_code);

-- Index on ticket_id for fast pass lookup
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_id ON registrations (ticket_id);

-- Index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations (created_at DESC);
