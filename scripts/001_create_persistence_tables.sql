CREATE TABLE IF NOT EXISTS investigation_cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    transaction_ids TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL
        CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')),
    priority TEXT NOT NULL
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    notes JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(notes) = 'array'),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigation_cases_created
    ON investigation_cases (created_at DESC);

CREATE TABLE IF NOT EXISTS evidence_records (
    id TEXT PRIMARY KEY,
    source_file TEXT NOT NULL,
    mode TEXT NOT NULL,
    extracted_text TEXT NOT NULL DEFAULT '',
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewed_fields JSONB,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (verified_at IS NULL OR acknowledged = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_evidence_records_created
    ON evidence_records (created_at DESC);
