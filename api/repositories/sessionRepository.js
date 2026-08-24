import { queryDataBase } from '../app.js';

const sessionRepository = {
    async create(data) {
        const result = await queryDataBase(`
            INSERT INTO "Ecosystem".user_sessions (
                session_token_hash,
                user_id,
                idle_expires_at,
                absolute_expires_at,
                ip_hash,
                user_agent_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, created_at, last_activity_at,
                idle_expires_at, absolute_expires_at
        `, [
            data.tokenHash,
            data.userId,
            data.idleExpiresAt,
            data.absoluteExpiresAt,
            data.ipHash,
            data.userAgentHash
        ]);
        return result.rows[0];
    },

    async findActiveByTokenHash(tokenHash) {
        const result = await queryDataBase(`
            SELECT
                s.id,
                s.user_id,
                s.created_at,
                s.last_activity_at,
                s.idle_expires_at,
                s.absolute_expires_at,
                u.user_name,
                u.user_mail,
                u.status AS user_status
            FROM "Ecosystem".user_sessions AS s
            INNER JOIN "Ecosystem".users AS u ON u.user_id = s.user_id
            WHERE s.session_token_hash = $1
              AND s.revoked_at IS NULL
              AND s.idle_expires_at > NOW()
              AND s.absolute_expires_at > NOW()
              AND u.status IN ('active', 'hidden')
            LIMIT 1
        `, [tokenHash]);
        return result.rows[0] || null;
    },

    async touch(id, idleExpiresAt) {
        await queryDataBase(`
            UPDATE "Ecosystem".user_sessions
            SET last_activity_at = NOW(), idle_expires_at = $2
            WHERE id = $1 AND revoked_at IS NULL
        `, [id, idleExpiresAt]);
    },

    async revokeByTokenHash(tokenHash, reason) {
        const result = await queryDataBase(`
            UPDATE "Ecosystem".user_sessions
            SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = COALESCE(revoked_reason, $2)
            WHERE session_token_hash = $1
        `, [tokenHash, reason]);
        return result.rowCount;
    },

    async revokeAllForUser(userId, reason) {
        const result = await queryDataBase(`
            UPDATE "Ecosystem".user_sessions
            SET revoked_at = NOW(), revoked_reason = $2
            WHERE user_id = $1 AND revoked_at IS NULL
        `, [userId, reason]);
        return result.rowCount;
    },

    async findMembership(userId, companyId) {
        const result = await queryDataBase(`
            SELECT m.company_id, m.role_id, m.status, r.config AS role_config
            FROM "Ecosystem".user_company_memberships AS m
            LEFT JOIN "Ecosystem".roles AS r ON r.id = m.role_id
            WHERE m.user_id = $1 AND m.company_id = $2 AND m.status = 'active'
            LIMIT 1
        `, [userId, companyId]);
        return result.rows[0] || null;
    },

    async listCompaniesForUser(userId) {
        const result = await queryDataBase(`
            SELECT c.company_id, c.legal_name, c.trade_name, c.company_key,
                m.role_id, r.name AS role_name
            FROM "Ecosystem".user_company_memberships AS m
            INNER JOIN "Ecosystem".companies AS c ON c.company_id = m.company_id
            LEFT JOIN "Ecosystem".roles AS r ON r.id = m.role_id
            WHERE m.user_id = $1 AND m.status = 'active'
            ORDER BY c.legal_name ASC
        `, [userId]);
        return result.rows;
    }
};

export default sessionRepository;
