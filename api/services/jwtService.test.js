import test from 'node:test';
import assert from 'node:assert/strict';
import jwtService from './jwtService.js';

process.env.INTEGRATION_JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-bytes';
process.env.INTEGRATION_JWT_ISSUER = 'sga360-test';
process.env.INTEGRATION_JWT_AUDIENCE = 'sga360-integrations-test';

const tokenInput = {
    integrationId: 10,
    clientId: 'zj-orders-test',
    companyId: 52,
    serviceUserId: 81,
    scopes: ['catalogs:read'],
    tokenVersion: 1,
    expiresIn: 300
};

test('firma y verifica un JWT con el contexto empresarial', () => {
    const signed = jwtService.signAccessToken(tokenInput);
    const payload = jwtService.verifyAccessToken(signed.token);

    assert.equal(payload.sub, tokenInput.clientId);
    assert.equal(payload.company_id, tokenInput.companyId);
    assert.equal(payload.service_user_id, tokenInput.serviceUserId);
    assert.deepEqual(payload.scopes, tokenInput.scopes);
    assert.equal(payload.token_version, 1);
});

test('rechaza un JWT manipulado', () => {
    const signed = jwtService.signAccessToken(tokenInput);
    const parts = signed.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    payload.company_id = 999;
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');

    assert.throws(
        () => jwtService.verifyAccessToken(parts.join('.')),
        error => error.code === 'INVALID_ACCESS_TOKEN'
    );
});

test('permite tokens de integración con vigencia de 3 horas', () => {
    const signed = jwtService.signAccessToken({
        ...tokenInput,
        expiresIn: 10800
    });

    assert.equal(signed.expiresIn, 10800);
    assert.equal(signed.payload.exp - signed.payload.iat, 10800);
});

test('limita la vigencia máxima del token a 3 horas', () => {
    const signed = jwtService.signAccessToken({
        ...tokenInput,
        expiresIn: 86400
    });

    assert.equal(signed.expiresIn, 10800);
    assert.equal(signed.payload.exp - signed.payload.iat, 10800);
});
