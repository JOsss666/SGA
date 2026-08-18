BEGIN;

CREATE TABLE IF NOT EXISTS "Ecosystem".user_company_memberships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "Ecosystem".users(user_id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    role_id BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled', 'invited')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS user_company_memberships_company_user_idx
    ON "Ecosystem".user_company_memberships (company_id, user_id)
    WHERE status = 'active';

INSERT INTO "Ecosystem".user_company_memberships (user_id, company_id, status)
SELECT user_id, company_id, 'active'
FROM "Ecosystem".users
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

INSERT INTO "Ecosystem".user_company_memberships (user_id, company_id, role_id, status)
SELECT user_id, company_id, role, 'active'
FROM "Ecosystem".users_config
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id)
DO UPDATE SET role_id = EXCLUDED.role_id, updated_at = NOW();

UPDATE "Ecosystem".user_company_memberships AS membership
SET role_id = user_config.role,
    updated_at = NOW()
FROM "Ecosystem".users_config AS user_config
WHERE user_config.user_id = membership.user_id
  AND user_config.company_id = membership.company_id
  AND membership.role_id IS NULL;

CREATE TABLE IF NOT EXISTS "Ecosystem".user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_token_hash CHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES "Ecosystem".users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idle_expires_at TIMESTAMPTZ NOT NULL,
    absolute_expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoked_reason VARCHAR(100) NULL,
    ip_hash CHAR(64) NULL,
    user_agent_hash CHAR(64) NULL
);

CREATE INDEX IF NOT EXISTS user_sessions_active_token_idx
    ON "Ecosystem".user_sessions (session_token_hash)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS user_sessions_user_active_idx
    ON "Ecosystem".user_sessions (user_id, absolute_expires_at)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS user_sessions_expiration_idx
    ON "Ecosystem".user_sessions (absolute_expires_at, idle_expires_at);

COMMIT;
