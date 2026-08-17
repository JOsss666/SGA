import test from 'node:test';
import assert from 'node:assert/strict';
import clientSecretService from './clientSecretService.js';

test('genera secretos suficientemente largos y diferentes', () => {
    const first = clientSecretService.generate();
    const second = clientSecretService.generate();
    assert.ok(first.length >= 32);
    assert.notEqual(first, second);
});

test('crea un hash scrypt y verifica el secreto sin almacenarlo', async () => {
    const secret = clientSecretService.generate();
    const hash = await clientSecretService.hash(secret);
    assert.match(hash, /^scrypt-v1\$/);
    assert.equal(hash.includes(secret), false);
    assert.equal(await clientSecretService.verify(secret, hash), true);
    assert.equal(await clientSecretService.verify(`${secret}-incorrecto`, hash), false);
});
