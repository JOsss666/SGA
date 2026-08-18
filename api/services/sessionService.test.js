import test from 'node:test';
import assert from 'node:assert/strict';
import SessionService from './sessionServiceCore.js';

const config = {
    tokenPepper: 'a-secure-test-pepper-with-more-than-32-characters',
    idleTimeoutMinutes: 45,
    absoluteTimeoutHours: 8,
    touchIntervalMinutes: 5
};

test('crea una sesión guardando un hash y no el token original', async () => {
    let stored;
    const repository = {
        async create(data) {
            stored = data;
            return { id: 1, user_id: data.userId };
        }
    };
    const service = new SessionService({
        repository,
        config,
        now: () => new Date('2026-08-18T12:00:00.000Z')
    });

    const result = await service.createSession({ userId: 10, ip: '127.0.0.1', userAgent: 'test' });

    assert.equal(result.rawToken.length >= 32, true);
    assert.notEqual(stored.tokenHash, result.rawToken);
    assert.equal(stored.tokenHash.length, 64);
    assert.equal(stored.userId, 10);
    assert.equal(stored.idleExpiresAt.toISOString(), '2026-08-18T12:45:00.000Z');
    assert.equal(stored.absoluteExpiresAt.toISOString(), '2026-08-18T20:00:00.000Z');
});

test('rechaza un token sin una sesión activa', async () => {
    const service = new SessionService({
        repository: { async findActiveByTokenHash() { return null; } },
        config
    });

    await assert.rejects(
        service.validateSession('a'.repeat(43)),
        error => error.code === 'SESSION_EXPIRED'
    );
});

test('renueva la expiración por inactividad sin superar la expiración absoluta', async () => {
    let touchedExpiration;
    const repository = {
        async findActiveByTokenHash() {
            return {
                id: 2,
                user_id: 10,
                last_activity_at: '2026-08-18T11:00:00.000Z',
                absolute_expires_at: '2026-08-18T12:20:00.000Z'
            };
        },
        async touch(id, expiration) {
            assert.equal(id, 2);
            touchedExpiration = expiration;
        }
    };
    const service = new SessionService({
        repository,
        config,
        now: () => new Date('2026-08-18T12:00:00.000Z')
    });

    await service.validateSession('b'.repeat(43));
    assert.equal(touchedExpiration.toISOString(), '2026-08-18T12:20:00.000Z');
});
